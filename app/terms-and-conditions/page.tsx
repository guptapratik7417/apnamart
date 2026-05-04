import LegalPage from "@/components/LegalPage";
import { getSiteConfig } from "@/lib/site-config";

export default async function TermsAndConditionsPage() {
  const config = await getSiteConfig();
  return <LegalPage page={config.legal.termsAndConditions} />;
}
