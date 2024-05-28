import { IGraphReducer } from "../contexts";

export function composeReducers<
  NodeData = unknown,
  EdgeData = unknown,
  PortData = unknown,
  Action = never
>(
  reducers: ReadonlyArray<IGraphReducer<NodeData, EdgeData, PortData, Action>>
): IGraphReducer<NodeData, EdgeData, PortData, Action> {
  return (next) => reducers.reduceRight((prev, current) => current(prev), next);
}
