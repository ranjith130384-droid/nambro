import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

export interface OcrResult {
  reading: number;
  confidence: number;
}

export interface SplitCalculation {
  unitsConsumed: number;
  totalRoomCost: number;
  perBedShare: number;
  requiresManualReview: boolean;
}

/**
 * Extracts the numeric kWh reading from a sub-meter image using Google Gemini Flash Vision API.
 */
export async function extractMeterReading(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<OcrResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      reading: {
        type: SchemaType.NUMBER,
        description: "The numeric electricity meter reading extracted from the image. Should be a number."
      },
      confidence: {
        type: SchemaType.NUMBER,
        description: "A confidence score between 0.0 and 1.0 indicating how confident you are in the reading."
      }
    },
    required: ["reading", "confidence"]
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const imageParts = [
    {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType
      }
    }
  ];

  const result = await model.generateContent([
    "Extract the electricity meter reading (kWh) from this image. Please provide the numeric reading and a confidence score.",
    ...imageParts
  ]);

  const responseText = result.response.text();
  const parsedResponse = JSON.parse(responseText);

  return {
    reading: Number(parsedResponse.reading),
    confidence: Number(parsedResponse.confidence)
  };
}

/**
 * Calculates room metrics for electricity billing and splits across active room occupants.
 */
export function calculateElectricitySplit(
  previousReading: number,
  currentReading: number,
  ratePerUnit: number,
  activeOccupants: number
): SplitCalculation {
  const unitsConsumed = currentReading - previousReading;
  const requiresManualReview = unitsConsumed < 0;

  const actualUnits = Math.max(0, unitsConsumed);
  const totalRoomCost = actualUnits * ratePerUnit;
  const perBedShare = activeOccupants > 0 ? totalRoomCost / activeOccupants : 0;

  return {
    unitsConsumed: Number(actualUnits.toFixed(2)),
    totalRoomCost: Number(totalRoomCost.toFixed(2)),
    perBedShare: Number(perBedShare.toFixed(2)),
    requiresManualReview,
  };
}
