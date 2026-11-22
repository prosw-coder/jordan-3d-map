export async function onRequest() {
  const headers = {
    "Content-Type": "application/geo+json; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    const metadataResponse = await fetch("https://www.geoboundaries.org/api/current/gbOpen/JOR/ADM1/", {
      headers: { "Accept": "application/json" },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });
    if (!metadataResponse.ok) throw new Error("Boundary metadata request failed");

    const metadata = await metadataResponse.json();
    const sourceUrl = metadata.gjDownloadURL || metadata.simplifiedGeometryGeoJSON;
    if (!sourceUrl) throw new Error("Boundary source URL is missing");

    const geoResponse = await fetch(sourceUrl, {
      headers: { "Accept": "application/geo+json, application/json" },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });
    if (!geoResponse.ok) throw new Error("GeoJSON download failed");

    const geojson = await geoResponse.json();
    if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features) || geojson.features.length < 12) {
      throw new Error("Invalid Jordan governorates GeoJSON");
    }

    return new Response(JSON.stringify(geojson), { status: 200, headers });
  } catch (error) {
    return Response.json(
      { error: "تعذّر تحميل بيانات خريطة الأردن", detail: String(error?.message || error) },
      { status: 502, headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }
    );
  }
}
