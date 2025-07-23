import { z } from 'zod';
import { INITIAL_DATA } from '../config';
import { constrainedStrings } from './common';
import { modelItemsSchema } from './modelItems';
import { viewsSchema } from './views';
import { validateModel } from './validation';
import { iconsSchema } from './icons';
import { colorsSchema } from './colors';
// 模型
export const modelSchema = z
  .object({
    version: z.string().max(10).optional(), // 版本
    title: constrainedStrings.name, // 模型名称
    description: constrainedStrings.description.optional(), // 模型描述
    items: modelItemsSchema, // 模型项
    views: viewsSchema, // 视图对象
    icons: iconsSchema, // 图标
    colors: colorsSchema // 颜色对象数组
  })
  .superRefine((model, ctx) => {
    const issues = validateModel({ ...INITIAL_DATA, ...model });

    issues.forEach((issue) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        params: issue.params,
        message: issue.message
      });
    });
  });
