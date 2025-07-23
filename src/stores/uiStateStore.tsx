import React, { createContext, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';
import {
  CoordsUtils,
  incrementZoom,
  decrementZoom,
  getStartingMode
} from 'src/utils';
import { UiStateStore } from 'src/types';
import { INITIAL_UI_STATE } from 'src/config';

const initialState = () => {
  return createStore<UiStateStore>((set, get) => {
    return {
      // 放大
      zoom: INITIAL_UI_STATE.zoom,
      // 滚动
      scroll: INITIAL_UI_STATE.scroll,
      // 视图id
      view: '',
      // 主菜单项
      mainMenuOptions: [],
      // 交互性只读
      editorMode: 'EXPLORABLE_READONLY',
      // 根据模式返回鼠标状态
      mode: getStartingMode('EXPLORABLE_READONLY'),
      // 图标状态
      iconCategoriesState: [],
      // 是否打开主菜单
      isMainMenuOpen: false,
      // 弹窗为null
      dialog: null,
      // 渲染的元素
      rendererEl: null,

      contextMenu: null,
      // 鼠标 位置 
      mouse: {
        position: { screen: CoordsUtils.zero(), tile: CoordsUtils.zero() },
        mousedown: null,
        delta: null
      },
      itemControls: null,
      // 是否开启debug模式
      enableDebugTools: false,
      actions: {
        // 设置视图
        setView: (view) => {
          set({ view });
        },
        // 设置主要选项
        setMainMenuOptions: (mainMenuOptions) => {
          set({ mainMenuOptions });
        },
        // 设置编辑模式
        setEditorMode: (mode) => {
          set({ editorMode: mode, mode: getStartingMode(mode) });
        },
        // 设置icon状态
        setIconCategoriesState: (iconCategoriesState) => {
          set({ iconCategoriesState });
        },
        // 重置ui状态
        resetUiState: () => {
          set({
            mode: getStartingMode(get().editorMode),
            scroll: {
              position: CoordsUtils.zero(),
              offset: CoordsUtils.zero()
            },
            itemControls: null,
            zoom: 1
          });
        },
        // 设置模式
        setMode: (mode) => {
          set({ mode });
        },
        // 设置弹窗
        setDialog: (dialog) => {
          set({ dialog });
        },
        // 设置是否开启主菜单
        setIsMainMenuOpen: (isMainMenuOpen) => {
          set({ isMainMenuOpen, itemControls: null });
        },
        // 增大倍数
        incrementZoom: () => {
          const { zoom } = get();
          set({ zoom: incrementZoom(zoom) });
        },
      // 减小倍数
        decrementZoom: () => {
          const { zoom } = get();
          set({ zoom: decrementZoom(zoom) });
        },
        // 设置倍数
        setZoom: (zoom) => {
          set({ zoom });
        },
        // 设置滚动位置和偏离
        setScroll: ({ position, offset }) => {
          set({ scroll: { position, offset: offset ?? get().scroll.offset } });
        },
        // 设置控制项
        setItemControls: (itemControls) => {
          set({ itemControls });
        },

        setContextMenu: (contextMenu) => {
          set({ contextMenu });
        },
        // 设置鼠标
        setMouse: (mouse) => {
          set({ mouse });
        },
        // 设置开发工具状态
        setEnableDebugTools: (enableDebugTools) => {
          set({ enableDebugTools });
        },
        // 设置渲染的元素
        setRendererEl: (el) => {
          set({ rendererEl: el });
        }
      }
    };
  });
};

const UiStateContext = createContext<ReturnType<typeof initialState> | null>(
  null
);

interface ProviderProps {
  children: React.ReactNode;
}

// TODO: Typings below are pretty gnarly due to the way Zustand works.
// see https://github.com/pmndrs/zustand/discussions/1180#discussioncomment-3439061
export const UiStateProvider = ({ children }: ProviderProps) => {
  const storeRef = useRef<ReturnType<typeof initialState>>();

  if (!storeRef.current) {
    storeRef.current = initialState();
  }

  return (
    <UiStateContext.Provider value={storeRef.current}>
      {children}
    </UiStateContext.Provider>
  );
};

export function useUiStateStore<T>(selector: (state: UiStateStore) => T) {
  const store = useContext(UiStateContext);

  if (store === null) {
    throw new Error('Missing provider in the tree');
  }

  const value = useStore(store, selector);
  return value;
}
