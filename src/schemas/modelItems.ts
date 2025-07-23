import { z } from 'zod';
import { id, constrainedStrings } from './common';

export const modelItemSchema = z.object({
  id, // id标识
  name: constrainedStrings.name, // 模型项名称
  description: constrainedStrings.description.optional(), // 模型详情
  icon: id.optional() // 图标
});

export const modelItemsSchema = z.array(modelItemSchema);
