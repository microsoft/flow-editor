import * as React from "react";
import { MenuType } from "../../../contexts";
import { useContextMenuConfigContext } from "../../../hooks";

export const MultiMenu: React.FunctionComponent = props => {
  const contextMenuConfig = useContextMenuConfigContext();
  contextMenuConfig.registerMenu(props.children, MenuType.Multi);
  return null;
};
