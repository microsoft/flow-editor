import * as React from "react";
import { useGraphState } from "../../../src";

export interface ITestItemContentProps {
  text: string;
}

export const TestItemContent: React.FC<ITestItemContentProps> = props => {
  const { state } = useGraphState();

  return <p>{`${props.text}:${state.behavior}`}</p>;
};
