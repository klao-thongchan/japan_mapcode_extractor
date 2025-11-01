
import { GoogleGenAI, Type } from "@google/genai";
import { Candidate, EnrichedDetails, GooglePlaceCandidate } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const findCandidatesSchema = {
    type: Type.OBJECT,
    properties: {
        candidates: {
            type: Type.ARRAY,
            description: "A list of up to 3 potential matches if the input is ambiguous.",
            items: {
                type: Type.OBJECT,
                properties: {
                    place_id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    address: { type: Type.STRING },
                },
            },
        },
        error: { type: Type.STRING, description: "An error message if no places could be found." },
    },
};

const enrichDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        place_name_en: { type: Type.STRING, description: "Place name in English" },
        place_name_ja: { type: Type.STRING, description: "Place name in Japanese" },
        mapcode: { type: Type.STRING, description: "The Japan Mapcode, e.g., '224 489 815*64'" },
        telephone: { type: Type.STRING, description: "International phone number" },
        address: { type: Type.STRING, description: "Formatted address" },
        error: { type: Type.STRING, description: "An error message if any step failed." }
    },
    required: ["place_name_en", "place_name_ja", "mapcode", "telephone", "address"]
};

export async function findPlaceCandidates(candidate: Candidate): Promise<{ candidates?: GooglePlaceCandidate[]; error?: string; }> {
    const prompt = `
You are an expert at finding places in Japan. Your task is to use Google Places Text Search to find potential matches for a given place name.

Input place:
- Main Name: "${candidate.main_name}"
- Hint City: "${candidate.hint_city || ''}"

Instructions:
1.  Perform a Google Places Text Search in Japan (region=jp) with the query: "${candidate.main_name} ${candidate.hint_city || ''}".
2.  Analyze the results.
3.  Return a JSON object containing a list of the top 3 most relevant candidates. Each candidate must have a 'place_id', 'name', and 'address'.
4.  If no results are found, return an error message.
5.  Do not include any other text or explanation outside the JSON object.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: findCandidatesSchema,
            },
        });

        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText) as { candidates?: GooglePlaceCandidate[], error?: string };
        if (data.error) {
            throw new Error(data.error);
        }
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No places found.");
        }
        return data;
    } catch (error) {
        console.error("Gemini API error finding candidates for:", candidate, error);
        return { error: error instanceof Error ? error.message : "Failed to find candidates." };
    }
}


export async function getEnrichedDetails(place_id: string, original_name: string): Promise<EnrichedDetails> {
    const prompt = `
You are an expert data enrichment API. Given a Google Place ID for a location in Japan, your task is to find its details and its Mapcode.

Input:
- Place ID: "${place_id}"
- Original Name: "${original_name}" (for context)

Follow these steps precisely:
1.  Using the provided \`place_id\`, get Google Place Details for \`language=en\` (fields: name, formatted_address, international_phone_number) and \`language=ja\` (fields: name).
2.  Search for the Mapcode on japanmapcode.com for the English place name from the previous step. Choose the most likely match.
3.  Return a single JSON object with the specified schema. If any data is unavailable (e.g., telephone), return an empty string for that field.

Do not include any other text or explanation outside the JSON object.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: enrichDetailsSchema,
            },
        });
        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText) as EnrichedDetails;
        if (data.error) {
            throw new Error(data.error);
        }
        return data;

    } catch (error) {
        console.error("Gemini API error enriching place ID:", place_id, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during enrichment.";
        return {
            place_name_en: '',
            place_name_ja: '',
            mapcode: '',
            telephone: '',
            address: '',
            error: errorMessage.slice(0, 100)
        };
    }
}
