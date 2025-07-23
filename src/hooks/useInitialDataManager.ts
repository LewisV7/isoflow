import { useCallback, useState, useRef } from 'react';
import { InitialData, IconCollectionState } from 'src/types';
import { INITIAL_DATA, INITIAL_SCENE_STATE } from 'src/config';
import {
  getFitToViewParams,
  CoordsUtils,
  categoriseIcons,
  generateId,
  getItemByIdOrThrow
} from 'src/utils';
import * as reducers from 'src/stores/reducers';
import { useModelStore } from 'src/stores/modelStore';
import { useView } from 'src/hooks/useView';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { modelSchema } from 'src/schemas/model';

// 初始化数据管理器
export const useInitialDataManager = () => {
  // 是否准备完毕
  const [isReady, setIsReady] = useState(false);
  // 响应式的数据
  const prevInitialData = useRef<InitialData>();
  const model = useModelStore((state) => {
    return state;
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const rendererEl = useUiStateStore((state) => {
    return state.rendererEl;
  });
  const { changeView } = useView();

  const load = useCallback(
    (_initialData: InitialData) => {
      if (!_initialData || prevInitialData.current === _initialData) return;
      // 设置是否准备好为false
      setIsReady(false);
      // 判断initData有没有出错
      const validationResult = modelSchema.safeParse(_initialData);

      if (!validationResult.success) {
        // TODO: let's get better at reporting error messages here (starting with how we present them to users)
        // - not in console but in a modal
        console.log(validationResult.error.errors);
        window.alert('There is an error in your model.');
        return;
      }

      const initialData = _initialData;
      // 如果初始化数据的views数组为0 则采用创建view操作
      if (initialData.views.length === 0) {
        const updates = reducers.view({
          action: 'CREATE_VIEW',
          payload: {},
          ctx: {
            state: { model: initialData, scene: INITIAL_SCENE_STATE },
            viewId: generateId()
          }
        });
        // 并把这些更新的东西给初始化数据
        Object.assign(initialData, updates.model);
      }
      // 把初始化的数据在加以响应式
      prevInitialData.current = initialData;
      // 把数据赋值给model
      model.actions.set(initialData);
      // 获取view
      const view = getItemByIdOrThrow(
        initialData.views,
        initialData.view ?? initialData.views[0].id
      );
      // 改变视图
      changeView(view.value.id, initialData);
      // 判断是否全部展示

      if (initialData.fitToView) {
        // 获取元素大小
        const rendererSize = rendererEl?.getBoundingClientRect();
        // 获取放大倍数和滚动
        const { zoom, scroll } = getFitToViewParams(view.value, {
          width: rendererSize?.width ?? 0,
          height: rendererSize?.height ?? 0
        });
        // 设置滚动位置
        uiStateActions.setScroll({
          position: scroll,
          offset: CoordsUtils.zero()
        });
        // 设置zoom
        uiStateActions.setZoom(zoom);
      }

      const categoriesState: IconCollectionState[] = categoriseIcons(
        initialData.icons
      ).map((collection) => {
        return {
          id: collection.name,
          isExpanded: false
        };
      });

      uiStateActions.setIconCategoriesState(categoriesState);
      // 设置准备就绪
      setIsReady(true);
    },
    [changeView, model.actions, rendererEl, uiStateActions]
  );

  const clear = useCallback(() => {
    load({ ...INITIAL_DATA, icons: model.icons, colors: model.colors });
    // 重置ui
    uiStateActions.resetUiState();
  }, [load, model.icons, model.colors, uiStateActions]);

  return {
    load,
    clear,
    isReady
  };
};
