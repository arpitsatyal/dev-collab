import axios from "axios";
import { BaseItems, ItemType } from "../types";

export const syncMeiliSearch = async (doc: BaseItems, type: ItemType) => {
  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/sync`,
      {
        doc,
        type,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (syncError) {
    console.warn("Sync service failed:", syncError);
  }
};
