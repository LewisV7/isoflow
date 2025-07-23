import { produce } from 'immer';
import { ModeActions, Coords, ItemReference } from 'src/types';
import { useScene } from 'src/hooks/useScene';
import {
  getItemByIdOrThrow,
  CoordsUtils,
  hasMovedTile,
  getAnchorParent,
  getItemAtTile
} from 'src/utils';

// 拖拽物品
const dragItems = (
  items: ItemReference[],
  tile: Coords,
  delta: Coords,
  scene: ReturnType<typeof useScene>
) => {
  // 循环物品引用数组
  items.forEach((item) => {
    // 如果存在ITEM 则根据屏幕中的items 和 id 拿到节点
    if (item.type === 'ITEM') {
      const node = getItemByIdOrThrow(scene.items, item.id).value;
      // 屏幕更新viewItem 根据项目ID
      scene.updateViewItem(item.id, {
        tile: CoordsUtils.add(node.tile, delta)
      });
      // 如果是区域，更新区域 计算出
    } else if (item.type === 'RECTANGLE') {
      const rectangle = getItemByIdOrThrow(scene.rectangles, item.id).value;
      const newFrom = CoordsUtils.add(rectangle.from, delta);
      const newTo = CoordsUtils.add(rectangle.to, delta);

      scene.updateRectangle(item.id, { from: newFrom, to: newTo });
      // 如果是文字框
    } else if (item.type === 'TEXTBOX') {
      const textBox = getItemByIdOrThrow(scene.textBoxes, item.id).value;

      scene.updateTextBox(item.id, {
        tile: CoordsUtils.add(textBox.tile, delta)
      });
      // 如果是锚点连接项
    } else if (item.type === 'CONNECTOR_ANCHOR') {
      const connector = getAnchorParent(item.id, scene.connectors);

      const newConnector = produce(connector, (draft) => {
        const anchor = getItemByIdOrThrow(connector.anchors, item.id);

        const itemAtTile = getItemAtTile({ tile, scene });

        switch (itemAtTile?.type) {
          case 'ITEM':
            draft.anchors[anchor.index] = {
              ...anchor.value,
              ref: {
                item: itemAtTile.id
              }
            };
            break;
          case 'CONNECTOR_ANCHOR':
            draft.anchors[anchor.index] = {
              ...anchor.value,
              ref: {
                anchor: itemAtTile.id
              }
            };
            break;
          default:
            draft.anchors[anchor.index] = {
              ...anchor.value,
              ref: {
                tile
              }
            };
            break;
        }
      });

      scene.updateConnector(connector.id, newConnector);
    }
  });
};
// 拖拽物品的函数
export const DragItems: ModeActions = {
  // 进入以后 如果这个模式不是拖拽模式 饭hi
  entry: ({ uiState, rendererRef }) => {
    if (uiState.mode.type !== 'DRAG_ITEMS' || !uiState.mouse.mousedown) return;
    // 渲染元素 userSelect为none
    const renderer = rendererRef;
    renderer.style.userSelect = 'none';
  },
  // 退出后 渲染元素的userSelect为auto
  exit: ({ rendererRef }) => {
    const renderer = rendererRef;
    renderer.style.userSelect = 'auto';
  },
  // 鼠标移动
  mousemove: ({ uiState, scene }) => {
    if (uiState.mode.type !== 'DRAG_ITEMS' || !uiState.mouse.mousedown) return;
    // 如果是初次移动
    if (uiState.mode.isInitialMovement) {
      // 鼠标的x,y -  鼠标mousedown的x,y
      const delta = CoordsUtils.subtract(
        uiState.mouse.position.tile,
        uiState.mouse.mousedown.tile
      );
      // 更新位置
      dragItems(uiState.mode.items, uiState.mouse.position.tile, delta, scene);

      uiState.actions.setMode(
        produce(uiState.mode, (draft) => {
          draft.isInitialMovement = false;
        })
      );

      return;
    }

    if (!hasMovedTile(uiState.mouse) || !uiState.mouse.delta?.tile) return;

    const delta = uiState.mouse.delta.tile;

    dragItems(uiState.mode.items, uiState.mouse.position.tile, delta, scene);
  },
  // mouseUp 则变为CURSOR状态 并展示鼠标
  mouseup: ({ uiState }) => {
    uiState.actions.setMode({
      type: 'CURSOR',
      showCursor: true,
      mousedownItem: null
    });
  }
};
