import { cleanup, fireEvent, render, RenderResult } from "@testing-library/react";
import * as React from "react";

import { act } from "react-dom/test-utils";
import {
  dataReadonlyMode,
  GraphCanvasEvent,
  GraphModel,
  GraphNodeEvent,
  IEvent,
  IGraphReducer,
  previewMode,
} from "../../src";
import { GraphController } from "../../src/controllers/GraphController";
import { GraphControllerRef, TestComponent } from "../TestComponent";
import { mockBoundingBox, patchPointerEvent } from "../utils";
import { getSample1Data } from "./__data__/getSample1Data";

beforeAll(() => {
  patchPointerEvent();
  jest.useFakeTimers();
  mockBoundingBox();
});

beforeEach(() => {
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 0;
  });
});

afterEach(cleanup);

function simulateNodeMove(
  container: HTMLElement,
  points: Array<[number, number]>,
  eventInit: Partial<MouseEventInit> = {}
): void {
  const svg = container.querySelector("svg")!;
  expect(svg).toBeTruthy();
  const nodes = svg.querySelectorAll('[aria-roledescription="node"]');
  expect(nodes.length).not.toBe(0);
  const node = nodes[0];
  if (points.length === 0) {
    return;
  }
  const first = points[0];
  act(() => {
    fireEvent.pointerDown(node, {
      ...eventInit,
      pointerId: 0,
      clientX: first[0],
      clientY: first[1],
    });
  });
  points.forEach(([clientX, clientY]) => {
    act(() => {
      fireEvent.pointerMove(window, {
        ...eventInit,
        pointerId: 0,
        clientX,
        clientY,
      });
      jest.runAllTimers();
    });
  });
  const last = points[points.length - 1];
  act(() => {
    jest.runAllTimers();
    fireEvent.pointerUp(window, {
      ...eventInit,
      pointerId: 0,
      clientX: last[0],
      clientY: last[1],
    });
    fireEvent.click(node, {
      ...eventInit,
      clientX: last[0],
      clientY: last[1],
    });
  });
}

let recorder: (action: IEvent) => void;
let middleware: IGraphReducer;

beforeEach(() => {
  recorder = jest.fn();
  middleware = (next) => (state, action) => {
    recorder(action);
    return next(state, action);
  };
});

describe("drag node", () => {
  it("should receive drag event", () => {
    const onEvent = jest.fn();
    const { container } = render(
      <TestComponent
        graphProps={{
          onEvent,
        }}
      />
    );
    simulateNodeMove(container, [
      [100, 100],
      [150, 150],
    ]);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: GraphNodeEvent.Drag,
      })
    );
  });

  it("should not drag when dragging is disabled", () => {
    const { container } = render(<TestComponent settings={{ features: previewMode }} middleware={middleware} />);
    simulateNodeMove(container, [
      [100, 100],
      [150, 150],
    ]);

    expect(recorder).not.toBeCalledWith(expect.objectContaining({ type: GraphNodeEvent.Drag }));
  });

  it("should receive click event", () => {
    const { container } = render(<TestComponent settings={{ features: dataReadonlyMode }} middleware={middleware} />);
    simulateNodeMove(container, [
      [100, 100],
      [105, 105],
    ]);
    expect(recorder).toBeCalledWith(expect.objectContaining({ type: GraphNodeEvent.Click }));
  });

  it("should not receive click event", () => {
    const { container } = render(<TestComponent settings={{ features: previewMode }} middleware={middleware} />);
    simulateNodeMove(container, [
      [100, 100],
      [105, 105],
    ]);
    expect(recorder).not.toBeCalledWith(expect.objectContaining({ type: GraphNodeEvent.Drag }));
    expect(recorder).not.toBeCalledWith(expect.objectContaining({ type: GraphNodeEvent.Click }));
  });
});

describe("test drag and selection", () => {
  let wrapper: RenderResult;
  let container: HTMLElement;
  let graphController: GraphController;
  const getData = () => graphController.state.data.present;
  const updateData = (f: (prev: GraphModel) => GraphModel) => {
    act(() => {
      graphController.dispatch({
        type: GraphCanvasEvent.UpdateData,
        updater: f,
        shouldRecord: false,
      });
    });
  };
  beforeEach(() => {
    const graphControllerRef = React.createRef<GraphController>();
    wrapper = render(
      <TestComponent data={GraphModel.fromJSON(getSample1Data())}>
        <GraphControllerRef ref={graphControllerRef} />
      </TestComponent>
    );
    container = wrapper.container;
    graphController = graphControllerRef.current!;
    expect(graphController).toBeDefined();
  });

  it("should select one node", () => {
    simulateNodeMove(container, [
      [100, 100],
      [105, 105],
    ]);
    expect(getData().toJSON()).toEqual(
      GraphModel.fromJSON(getSample1Data())
        .selectNodes((node) => node.id === "47566002")
        .toJSON()
    );
  });

  it("should drag one node", () => {
    simulateNodeMove(container, [
      [100, 100],
      [110, 110],
    ]);
    expect(getData().toJSON()).toEqual(
      GraphModel.fromJSON(getSample1Data())
        .updateNode("47566002", (node) => ({
          ...node,
          x: node.x + 10,
          y: node.y + 10,
        }))
        .toJSON()
    );
  });

  it("should drag one node when multiple nodes selected", () => {
    updateData((data) => data.selectNodes((node) => node.id === "fb404f70" || node.id === "4b199015"));
    simulateNodeMove(container, [
      [100, 100],
      [110, 110],
    ]);
    expect(getData().toJSON()).toEqual(
      GraphModel.fromJSON(getSample1Data())
        .selectNodes((node) => node.id === "fb404f70" || node.id === "4b199015")
        .updateNode("47566002", (node) => ({
          ...node,
          x: node.x + 10,
          y: node.y + 10,
        }))
        .toJSON()
    );
  });

  it("should drag multiple nodes", () => {
    updateData((data) =>
      data.selectNodes((node) => node.id === "47566002" || node.id === "fb404f70" || node.id === "4b199015")
    );
    simulateNodeMove(container, [
      [100, 100],
      [110, 110],
    ]);
    expect(getData().toJSON()).toEqual(
      GraphModel.fromJSON(getSample1Data())
        .selectNodes((node) => node.id === "47566002" || node.id === "fb404f70" || node.id === "4b199015")
        .updateNode("47566002", (node) => ({
          ...node,
          x: node.x + 10,
          y: node.y + 10,
        }))
        .updateNode("fb404f70", (node) => ({
          ...node,
          x: node.x + 10,
          y: node.y + 10,
        }))
        .updateNode("4b199015", (node) => ({
          ...node,
          x: node.x + 10,
          y: node.y + 10,
        }))
        .toJSON()
    );
  });

  it("should select one more node and drag multiple nodes", () => {
    updateData((data) => data.selectNodes((node) => node.id === "fb404f70" || node.id === "4b199015"));
    simulateNodeMove(
      container,
      [
        [100, 100],
        [110, 110],
      ],
      {
        shiftKey: true,
      }
    );
    expect(getData().toJSON()).toEqual(
      GraphModel.fromJSON(getSample1Data())
        .selectNodes((node) => node.id === "47566002" || node.id === "fb404f70" || node.id === "4b199015")
        .updateNode("47566002", (node) => ({
          ...node,
          x: node.x + 10,
          y: node.y + 10,
        }))
        .updateNode("fb404f70", (node) => ({
          ...node,
          x: node.x + 10,
          y: node.y + 10,
        }))
        .updateNode("4b199015", (node) => ({
          ...node,
          x: node.x + 10,
          y: node.y + 10,
        }))
        .toJSON()
    );
  });
});
