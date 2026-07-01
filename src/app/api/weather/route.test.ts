import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("/api/weather route", () => {
  const originalApiKey = process.env.OPENWEATHER_API_KEY;
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENWEATHER_API_KEY = "test-api-key";
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ weather: [{ id: 800 }] }),
    } as Response);
  });

  afterEach(() => {
    process.env.OPENWEATHER_API_KEY = originalApiKey;
    vi.unstubAllGlobals();
  });

  it.each([
    ["0", "0"],
    ["90", "180"],
    ["-90", "-180"],
  ])("accepts valid coordinates lat=%s lon=%s", async (lat, lon) => {
    const request = new Request(`http://localhost/api/weather?lat=${lat}&lon=${lon}`);

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=test-api-key`,
    );
  });

  it.each([
    ["91", "0"],
    ["-91", "0"],
    ["0", "181"],
    ["0", "-181"],
    ["150", "200"],
  ])("rejects invalid coordinates lat=%s lon=%s", async (lat, lon) => {
    const request = new Request(`http://localhost/api/weather?lat=${lat}&lon=${lon}`);

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid coordinates: lat must be -90..90, lon must be -180..180.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});