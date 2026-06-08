import clsx, { ClassValue } from "clsx";

/** Tiny className combiner. */
export const cn = (...inputs: ClassValue[]) => clsx(inputs);
