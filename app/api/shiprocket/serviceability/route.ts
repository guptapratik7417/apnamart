import { isAdminSession } from "@/lib/admin-auth";
import { getShiprocketServiceability } from "@/lib/shiprocket";

export async function GET(request: Request) {
  if (!(await isAdminSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const deliveryPostcode = url.searchParams.get("delivery_postcode") || "";
  const pickupPostcode = url.searchParams.get("pickup_postcode") || undefined;
  const weight = Number(url.searchParams.get("weight") || 0) || undefined;
  const cod = url.searchParams.get("cod") === "1";

  if (!/^\d{6}$/.test(deliveryPostcode)) {
    return Response.json(
      { error: "delivery_postcode must be a 6 digit pincode." },
      { status: 400 }
    );
  }

  try {
    const serviceability = await getShiprocketServiceability({
      pickupPostcode,
      deliveryPostcode,
      weight,
      cod,
    });
    return Response.json({ serviceability });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Shiprocket serviceability failed.",
      },
      { status: 400 }
    );
  }
}
