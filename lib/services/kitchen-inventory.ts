export interface RecipeIngredient {
  name: string;
  gramsPerHead: number;
}

export interface GroceryProcurementItem {
  ingredient: string;
  totalKgRequired: number;
}

/**
 * Headcount-to-Grocery Converter:
 * Calculates required grocery raw materials based on confirmed meal counts.
 */
export function calculateKitchenProcurement(
  confirmedHeadcount: number,
  recipe: RecipeIngredient[]
): GroceryProcurementItem[] {
  return recipe.map((item) => ({
    ingredient: item.name,
    totalKgRequired: Number(((confirmedHeadcount * item.gramsPerHead) / 1000).toFixed(2)),
  }));
}
