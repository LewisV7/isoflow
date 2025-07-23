import PF from 'pathfinding';
import { Size, Coords } from 'src/types';

interface Args {
  gridSize: Size;
  from: Coords;
  to: Coords;
}

// 寻找路径
export const findPath = ({ gridSize, from, to }: Args): Coords[] => {
  // 根据grid区域大小
  const grid = new PF.Grid(gridSize.width, gridSize.height);
  // 使用A*算法
  const finder = new PF.AStarFinder({
    heuristic: PF.Heuristic.manhattan,
    diagonalMovement: PF.DiagonalMovement.Always
  });
  // 根据开始节点到结束节点 获取路径
  const path = finder.findPath(from.x, from.y, to.x, to.y, grid);
  // 返回x和y
  const pathTiles = path.map((tile) => {
    return {
      x: tile[0],
      y: tile[1]
    };
  });

  return pathTiles;
};
