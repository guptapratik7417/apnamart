import { appProperties } from "@/config/app-properties";

type PincodeRouteContext = {
  params: Promise<{ pincode: string }>;
};

type CityLookupRow = {
  City?: string;
  District?: string;
  State?: string;
};

type PostalPinCodeResponse = Array<{
  Status?: string;
  PostOffice?: Array<{
    District?: string;
    State?: string;
  }> | null;
}>;

function clean(value?: string | null) {
  return value?.trim() || "";
}

export async function GET(_request: Request, context: PincodeRouteContext) {
  const { pincode } = await context.params;

  if (!/^\d{6}$/.test(pincode)) {
    return Response.json(
      { error: "Enter a valid 6 digit pincode." },
      { status: 400 }
    );
  }

  try {
    const cityResponse = await fetch(
      `${appProperties.pincodeLookup.cityLookupUrl}?pincode=${pincode}`,
      { next: { revalidate: 60 * 60 * 24 } }
    );

    if (cityResponse.ok) {
      const rows = (await cityResponse.json()) as CityLookupRow[];
      const row = Array.isArray(rows) ? rows[0] : null;
      const city = clean(row?.City) || clean(row?.District);
      const state = clean(row?.State);

      if (city && state) {
        return Response.json({
          pincode,
          city,
          district: clean(row?.District),
          state,
        });
      }
    }
  } catch {
    // Fall through to the broader postal lookup API.
  }

  try {
    const postalResponse = await fetch(
      `${appProperties.pincodeLookup.postalLookupUrl}/${pincode}`,
      { next: { revalidate: 60 * 60 * 24 } }
    );

    if (!postalResponse.ok) {
      throw new Error("Pincode lookup failed.");
    }

    const payload = (await postalResponse.json()) as PostalPinCodeResponse;
    const firstResult = payload[0];
    const office = firstResult?.PostOffice?.[0];
    const district = clean(office?.District);
    const state = clean(office?.State);

    if (firstResult?.Status === "Success" && district && state) {
      return Response.json({
        pincode,
        city: district,
        district,
        state,
      });
    }
  } catch {
    return Response.json(
      { error: "Pincode lookup failed. Please enter city and state manually." },
      { status: 502 }
    );
  }

  return Response.json(
    { error: "No city/state found for this pincode." },
    { status: 404 }
  );
}
