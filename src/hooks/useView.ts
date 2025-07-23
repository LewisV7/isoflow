import { useCallback } from 'react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useSceneStore } from 'src/stores/sceneStore';
import * as reducers from 'src/stores/reducers';
import { Model } from 'src/types';
import { INITIAL_SCENE_STATE } from 'src/config';

export const useView = () => {
  // 返回ui操作
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  // 返回屏幕操作
  const sceneActions = useSceneStore((state) => {
    return state.actions;
  });
  // 改变view
  const changeView = useCallback(
    (viewId: string, model: Model) => {
      const newState = reducers.view({
        action: 'SYNC_SCENE',
        payload: undefined,
        ctx: { viewId, state: { model, scene: INITIAL_SCENE_STATE } }
      });

      sceneActions.set(newState.scene);
      uiStateActions.setView(viewId);
    },
    [uiStateActions, sceneActions]
  );

  return {
    changeView
  };
};
