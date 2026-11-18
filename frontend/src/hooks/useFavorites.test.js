import { act, renderHook } from "@testing-library/react";
import useFavorites, {
  FAVORITES_STORAGE_KEY,
  clearFavorites,
  getFavorites,
  isFavorite,
  removeFavorite,
  toggleFavorite,
} from "./useFavorites";

const property = {
  id: 1,
  L_ListingID: "1118422731",
  L_Address: "1461 Laurel Way",
  L_City: "Beverly Hills",
  L_State: "CA",
  L_Zip: "90210",
  L_SystemPrice: 3950000,
  L_Keyword2: 4,
  LM_Dec_3: "5.0",
  LM_Int2_3: 3677,
  L_Status: "Active",
  L_Photos: JSON.stringify(["https://example.com/1.jpg"]),
  L_Remarks: "A very long description that does not belong in storage.",
};

const secondProperty = {
  ...property,
  id: 2,
  L_ListingID: "1118422732",
  L_Address: "582 Pasture Ave",
};

function storedJson() {
  return JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY));
}

function seedStorage(entries) {
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(entries));
}

// A fresh module load is what a page refresh looks like: the in-memory copy is
// empty and everything comes from localStorage.
function loadFreshModule() {
  let fresh = null;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    fresh = require("./useFavorites");
  });
  return fresh;
}

describe("useFavorites", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearFavorites();
  });

  it("starts empty when nothing has been saved", () => {
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("saves a property and writes it to localStorage", () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite(property);
    });

    expect(result.current.count).toBe(1);
    expect(result.current.isFavorite("1118422731")).toBe(true);

    const stored = storedJson();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("1118422731");
    expect(stored[0].property.L_Address).toBe("1461 Laurel Way");
  });

  it("keeps only the card fields, not the whole listing row", () => {
    toggleFavorite(property);

    expect(storedJson()[0].property).not.toHaveProperty("L_Remarks");
    expect(storedJson()[0].property).toHaveProperty("L_SystemPrice", 3950000);
  });

  it("removes a property when it is toggled off", () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggleFavorite(property);
    });
    act(() => {
      result.current.toggleFavorite(property);
    });

    expect(result.current.count).toBe(0);
    expect(result.current.isFavorite("1118422731")).toBe(false);
    expect(storedJson()).toEqual([]);
  });

  it("matches ids whether they arrive as strings or numbers", () => {
    toggleFavorite(property);

    expect(isFavorite("1118422731")).toBe(true);
    expect(isFavorite(1118422731)).toBe(true);
    expect(isFavorite("999")).toBe(false);
    expect(isFavorite(undefined)).toBe(false);
  });

  it("puts the newest favorite first", () => {
    toggleFavorite(property);
    toggleFavorite(secondProperty);

    expect(getFavorites().map((entry) => entry.id)).toEqual([
      "1118422732",
      "1118422731",
    ]);
  });

  it("removes a single favorite by id", () => {
    toggleFavorite(property);
    toggleFavorite(secondProperty);

    removeFavorite("1118422731");

    expect(getFavorites().map((entry) => entry.id)).toEqual(["1118422732"]);
  });

  it("ignores a remove for a listing that is not saved", () => {
    toggleFavorite(property);
    removeFavorite("not-saved");

    expect(getFavorites()).toHaveLength(1);
  });

  it("ignores a property with no listing id", () => {
    toggleFavorite({ L_Address: "No id here" });
    toggleFavorite(null);

    expect(getFavorites()).toHaveLength(0);
  });

  it("restores favorites on a fresh page load", () => {
    toggleFavorite(property);

    const fresh = loadFreshModule();

    expect(fresh.getFavorites()).toHaveLength(1);
    expect(fresh.isFavorite("1118422731")).toBe(true);
    expect(fresh.getFavorites()[0].property.L_Address).toBe("1461 Laurel Way");
  });

  it("recovers from a malformed stored value", () => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, "{not json");

    const fresh = loadFreshModule();

    expect(fresh.getFavorites()).toEqual([]);
  });

  it("drops stored entries that make no sense", () => {
    seedStorage([
      { id: "1118422731", property: { L_ListingID: "1118422731", L_Address: "Kept" } },
      { id: "222", property: null },
      { property: { L_Address: "No id at all" } },
      null,
      "nonsense",
    ]);

    const fresh = loadFreshModule();

    expect(fresh.getFavorites()).toHaveLength(1);
    expect(fresh.getFavorites()[0].property.L_Address).toBe("Kept");
  });

  it("keeps every component that uses the hook in sync", () => {
    const first = renderHook(() => useFavorites());
    const second = renderHook(() => useFavorites());

    act(() => {
      first.result.current.toggleFavorite(property);
    });

    expect(first.result.current.count).toBe(1);
    expect(second.result.current.count).toBe(1);
    expect(second.result.current.isFavorite("1118422731")).toBe(true);

    act(() => {
      second.result.current.removeFavorite("1118422731");
    });

    expect(first.result.current.count).toBe(0);
  });

  it("picks up a change made in another tab", () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.count).toBe(0);

    act(() => {
      seedStorage([{ id: "1118422731", savedAt: null, property }]);
      window.dispatchEvent(
        new StorageEvent("storage", { key: FAVORITES_STORAGE_KEY })
      );
    });

    expect(result.current.count).toBe(1);

    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(
        new StorageEvent("storage", { key: FAVORITES_STORAGE_KEY })
      );
    });

    expect(result.current.count).toBe(0);
  });

  it("does not react to unrelated storage keys", () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      seedStorage([{ id: "1118422731", savedAt: null, property }]);
      window.dispatchEvent(new StorageEvent("storage", { key: "something-else" }));
    });

    expect(result.current.count).toBe(0);
  });

  it("still works in memory when storage is unavailable", () => {
    const getItem = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    try {
      expect(() => toggleFavorite(property)).not.toThrow();
      expect(isFavorite("1118422731")).toBe(true);
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it("clears every favorite", () => {
    toggleFavorite(property);
    toggleFavorite(secondProperty);

    clearFavorites();

    expect(getFavorites()).toEqual([]);
    expect(storedJson()).toEqual([]);
  });
});
