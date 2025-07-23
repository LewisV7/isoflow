import { Connector } from 'src/types';
import { produce } from 'immer';
import { getItemByIdOrThrow, getConnectorPath, getAllAnchors } from 'src/utils';
import { validateConnector } from 'src/schemas/validation';
import { State, ViewReducerContext } from './types';

// 删除连接器
export const deleteConnector = (
  id: string,
  { viewId, state }: ViewReducerContext
): State => {
  const view = getItemByIdOrThrow(state.model.views, viewId);
  const connector = getItemByIdOrThrow(view.value.connectors ?? [], id);
  // 删除连接器
  const newState = produce(state, (draft) => {
    draft.model.views[view.index].connectors?.splice(connector.index, 1);
    delete draft.scene.connectors[connector.index];
  });

  return newState;
};

// 同步连接器
export const syncConnector = (
  id: string,
  { viewId, state }: ViewReducerContext
) => {
  const newState = produce(state, (draft) => {
    // 根据视图数组和视图id返回某个具体的视图
    const view = getItemByIdOrThrow(draft.model.views, viewId);
    // 根据连接器数据和id返回某个具体的连接器
    const connector = getItemByIdOrThrow(view.value.connectors ?? [], id);
    // 返回全部的锚点
    const allAnchors = getAllAnchors(view.value.connectors ?? []);
    // 验证是否有问题
    const issues = validateConnector(connector.value, {
      view: view.value,
      model: state.model,
      allAnchors
    });
    // 问题大于0
    if (issues.length > 0) {
      const stateAfterDelete = deleteConnector(id, { viewId, state: draft });

      draft.scene = stateAfterDelete.scene;
      draft.model = stateAfterDelete.model;
    } else {
      // 得到路径
      const path = getConnectorPath({
        anchors: connector.value.anchors,
        view: view.value
      });
      // 连接点的path获取
      draft.scene.connectors[connector.value.id] = { path };
    }
  });

  return newState;
};
// 更新连接器
export const updateConnector = (
  { id, ...updates }: { id: string } & Partial<Connector>,
  { state, viewId }: ViewReducerContext
): State => {
  const newState = produce(state, (draft) => {
    // 获取view
    const view = getItemByIdOrThrow(draft.model.views, viewId);
    // 获取views中的连接器
    const { connectors } = draft.model.views[view.index];
    // 不存在返回
    if (!connectors) return;
    // 根据连接器 和 id返回连接器
    const connector = getItemByIdOrThrow(connectors, id);
    // 根据连接器和更新的东西，返回新的连接器
    const newConnector = { ...connector.value, ...updates };
    // 覆盖之前的连接器
    connectors[connector.index] = newConnector;
    // 更新的锚点存在的话
    if (updates.anchors) {
      // 同步连接器
      const stateAfterSync = syncConnector(newConnector.id, {
        viewId,
        state: draft
      });

      draft.model = stateAfterSync.model;
      draft.scene = stateAfterSync.scene;
    }
  });

  return newState;
};
// 创建连接器
export const createConnector = (
  newConnector: Connector,
  { state, viewId }: ViewReducerContext
): State => {
  const newState = produce(state, (draft) => {
    const view = getItemByIdOrThrow(draft.model.views, viewId);
    const { connectors } = draft.model.views[view.index];

    if (!connectors) {
      draft.model.views[view.index].connectors = [newConnector];
    } else {
      draft.model.views[view.index].connectors?.unshift(newConnector);
    }

    const stateAfterSync = syncConnector(newConnector.id, {
      viewId,
      state: draft
    });

    draft.model = stateAfterSync.model;
    draft.scene = stateAfterSync.scene;
  });

  return newState;
};
