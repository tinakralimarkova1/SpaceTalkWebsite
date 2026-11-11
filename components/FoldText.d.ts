import type { CSSProperties, JSX } from "react";

export interface FoldTextProps {
  text?: string;
  splitBy?: "char" | "word" | "line";
  hinge?: "top" | "bottom" | "left" | "right";
  foldStyle?: "paper" | "blinds" | "flip";
  duration?: number;
  stagger?: number;
  staggerFrom?: "start" | "center" | "end" | "edges" | "random" | number;
  foldAngle?: number;
  ease?: string;
  perspective?: number;
  creaseShading?: number;
  trigger?: "mount" | "scroll" | "hover" | "loop";
  loopDelay?: number;
  hoverRefold?: boolean;
  refoldRadius?: number;
  refoldAngle?: number;
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export default function FoldText(props: FoldTextProps): JSX.Element;
