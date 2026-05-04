import { appProperties } from "@/config/app-properties";
import type { OrderStatus } from "@/types";

export type OrderStatusOption = {
  value: OrderStatus;
  label: string;
  description: string;
};

export const ORDER_STATUS_OPTIONS: OrderStatusOption[] =
  appProperties.orderJourney.activeStatuses;

export const TERMINAL_ORDER_STATUS_OPTIONS: OrderStatusOption[] =
  appProperties.orderJourney.terminalStatuses;

export const ALL_ORDER_STATUS_OPTIONS = [
  ...ORDER_STATUS_OPTIONS,
  ...TERMINAL_ORDER_STATUS_OPTIONS,
] as const;

export function getOrderStatusOption(status: OrderStatus) {
  return (
    ALL_ORDER_STATUS_OPTIONS.find((option) => option.value === status) ||
    ORDER_STATUS_OPTIONS[0]
  );
}

export function getOrderStatusLabel(status: OrderStatus) {
  return getOrderStatusOption(status).label;
}

export function getOrderJourneySteps(status: OrderStatus) {
  const terminalStatus = TERMINAL_ORDER_STATUS_OPTIONS.find(
    (option) => option.value === status
  );

  if (terminalStatus) {
    return ORDER_STATUS_OPTIONS.map((step, index) => ({
      ...step,
      state: index === 0 ? "complete" : "cancelled",
    }));
  }

  const activeIndex = Math.max(
    ORDER_STATUS_OPTIONS.findIndex((step) => step.value === status),
    0
  );

  return ORDER_STATUS_OPTIONS.map((step, index) => ({
    ...step,
    state:
      index < activeIndex
        ? "complete"
        : index === activeIndex
          ? "current"
          : "upcoming",
  }));
}
