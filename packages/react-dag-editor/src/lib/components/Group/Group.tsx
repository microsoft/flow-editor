import * as React from "react";
import { defaultGroup } from "../../built-in/defaultGroup";
import { useGraphConfig } from "../../hooks/context";
import type { ICanvasGroup } from "../../models/canvas";
import type { ContentState } from "../../models/ContentState";
import { getGroupRect } from "../../utils/layout";

export interface IGroupProps {
  data: ContentState;
  group: ICanvasGroup;
}

export const Group: React.FC<IGroupProps> = (props) => {
  const { data, group } = props;
  const graphConfig = useGraphConfig();
  const { x, y, width, height } = React.useMemo(
    () => getGroupRect(group, data.nodes, graphConfig),
    [group, data.nodes, graphConfig]
  );

  const groupConfig =
    graphConfig.getGroupConfigByName(group.shape) ?? defaultGroup;

  const automationId = `group-container-${group.id}`;
  return (
    <g
      data-automation-id={automationId}
      key={group.id}
      transform={`translate(${x}, ${y})`}
    >
      {groupConfig.render({
        group,
        height,
        width,
      })}
    </g>
  );
};
