"use client";

import { useEffect, useState } from "react";
import { defaultSiteConfig } from "@/config/app-properties";
import type { SiteConfig } from "@/types";

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);

  useEffect(() => {
    let active = true;

    fetch("/api/site-config")
      .then((response) => response.json())
      .then((payload: { config?: SiteConfig }) => {
        if (active && payload.config) setConfig(payload.config);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return config;
}
