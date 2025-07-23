import { produce } from 'immer';
import { View } from 'src/types';
import { getItemByIdOrThrow } from 'src/utils';
import { VIEW_DEFAULTS, INITIAL_SCENE_STATE } from 'src/config';
import type { ViewReducerContext, State, ViewReducerParams } from './types';
import { syncConnector } from './connector';
import { syncTextBox } from './textBox';
import * as viewItemReducers from './viewItem';
import * as connectorReducers from './connector';
import * as textBoxReducers from './textBox';
import * as rectangleReducers from './rectangle';
import * as layerOrderingReducers from './layerOrdering';
// 更新视图
export const updateViewTimestamp = (ctx: ViewReducerContext): State => {
  // 时间
  const now = new Date().toISOString();

  const newState = produce(ctx.state, (draft) => {
    const view = getItemByIdOrThrow(draft.model.views, ctx.viewId);
    // 更新更新时间
    view.value.lastUpdated = now;
  });

  return newState;
};
// 同步屏幕
export const syncScene = ({ viewId, state }: ViewReducerContext): State => {
  // 根据视图数组和id获取该id的视图全部的数据
  const view = getItemByIdOrThrow(state.model.views, viewId);

  const startingState: State = {
    model: state.model,
    scene: INITIAL_SCENE_STATE
  };
  // 这个视图中的全部连接器
  const stateAfterConnectorsSynced = [
    ...(view.value.connectors ?? [])
  ].reduce<State>((acc, connector) => {
    return syncConnector(connector.id, { viewId, state: acc });
  }, startingState);

  const stateAfterTextBoxesSynced = [
    ...(view.value.textBoxes ?? [])
  ].reduce<State>((acc, textBox) => {
    return syncTextBox(textBox.id, { viewId, state: acc });
  }, stateAfterConnectorsSynced);

  return stateAfterTextBoxesSynced;
};

export const deleteView = (ctx: ViewReducerContext): State => {
  const newState = produce(ctx.state, (draft) => {
    const view = getItemByIdOrThrow(draft.model.views, ctx.viewId);

    draft.model.views.splice(view.index, 1);
  });

  return newState;
};

export const updateView = (
  updates: Partial<Pick<View, 'name'>>,
  ctx: ViewReducerContext
): State => {
  const newState = produce(ctx.state, (draft) => {
    const view = getItemByIdOrThrow(draft.model.views, ctx.viewId);
    view.value = { ...view.value, ...updates };
  });

  return newState;
};

export const createView = (
  newView: Partial<View>,
  ctx: ViewReducerContext
): State => {
  const newState = produce(ctx.state, (draft) => {
    draft.model.views.push({
      ...VIEW_DEFAULTS,
      id: ctx.viewId,
      ...newView
    });
  });

  return newState;
};
// view视图
export const view = ({ action, payload, ctx }: ViewReducerParams) => {
  // 新操作
  let newState: State;
  // 判断操作
  switch (action) {
    // 同步视图
    case 'SYNC_SCENE':
      newState = syncScene(ctx);
      break;
    // 创建新的view
    case 'CREATE_VIEW':
      newState = createView(payload, ctx);
      break;
    // 更新view
    case 'UPDATE_VIEW':
      newState = updateView(payload, ctx);
      break;
    // 删除view
    case 'DELETE_VIEW':
      newState = deleteView(ctx);
      break;
    // 创建视图项目
    case 'CREATE_VIEWITEM':
      newState = viewItemReducers.createViewItem(payload, ctx);
      break;
    // 更新视图项目
    case 'UPDATE_VIEWITEM':
      newState = viewItemReducers.updateViewItem(payload, ctx);
      break;
    // 删除视图项目
    case 'DELETE_VIEWITEM':
      newState = viewItemReducers.deleteViewItem(payload, ctx);
      break;
    // 创建连接器
    case 'CREATE_CONNECTOR':
      newState = connectorReducers.createConnector(payload, ctx);
      break;
    // 更新连接器
    case 'UPDATE_CONNECTOR':
      newState = connectorReducers.updateConnector(payload, ctx);
      break;
    // 同步连接器
    case 'SYNC_CONNECTOR':
      newState = connectorReducers.syncConnector(payload, ctx);
      break;
    // 删除连接器
    case 'DELETE_CONNECTOR':
      newState = connectorReducers.deleteConnector(payload, ctx);
      break;
    // 创建文本
    case 'CREATE_TEXTBOX':
      newState = textBoxReducers.createTextBox(payload, ctx);
      break;
    // 更新文本
    case 'UPDATE_TEXTBOX':
      newState = textBoxReducers.updateTextBox(payload, ctx);
      break;
    // 删除文本
    case 'DELETE_TEXTBOX':
      newState = textBoxReducers.deleteTextBox(payload, ctx);
      break;
    // 创建区域
    case 'CREATE_RECTANGLE':
      newState = rectangleReducers.createRectangle(payload, ctx);
      break;
    // 更新区域
    case 'UPDATE_RECTANGLE':
      newState = rectangleReducers.updateRectangle(payload, ctx);
      break;
    // 删除区域
    case 'DELETE_RECTANGLE':
      newState = rectangleReducers.deleteRectangle(payload, ctx);
      break;
    // 修改地形层级
    case 'CHANGE_LAYER_ORDER':
      newState = layerOrderingReducers.changeLayerOrder(payload, ctx);
      break;
    default:
      throw new Error('Invalid action.');
  }

  switch (action) {
    // 同步屏幕||删除视图 返回新状态
    case 'SYNC_SCENE':
    case 'DELETE_VIEW':
      return newState;
    default:
      // 否则更新视图
      return updateViewTimestamp({
        state: newState,
        viewId: ctx.viewId
      });
  }
};
