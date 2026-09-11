import type * as React from "react";

export type SDElementProps<P extends object = {}> = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  class?: string;
} & P;

export type SDButtonProps<P extends object = {}> = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  class?: string;
} & P;

export type SDSelectProps<P extends object = {}> = React.DetailedHTMLProps<
  React.SelectHTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  class?: string;
} & P;
