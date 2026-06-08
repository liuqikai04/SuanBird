import { readHistory, writeHistory } from "./historyStore.js";
import { HISTORY_LIMIT } from "../../config/constants.js";

export function createHistoryController() {
  let items = readHistory();

  function list() {
    return items;
  }

  function add(result) {
    items = [result, ...items.filter((item) => item.id !== result.id)].slice(
      0,
      HISTORY_LIMIT
    );
    writeHistory(items);
  }

  return {
    list,
    add
  };
}
