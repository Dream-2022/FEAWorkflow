// Workflow Routes - 工作流接口
// POST /workflow/run - 创建并执行工作流任务
// 对应 docs/3-architecture.md 第 4.2 节接口层设计

import { Router, Request, Response } from "express";
import { runWorkflow } from "../workflow/orchestrator";
import { WorkflowRunResponse } from "../workflow/types";
import { ResponseUtil } from "../utils/response";

const router = Router();

/**
 * POST /workflow/run
 * 创建并执行一个完整的工作流任务
 *
 * 请求体：
 * {
 *   "content": "为 Switch 组件新增 loading 与 disabled 联动能力"
 * }
 *
 * 响应：
 * {
 *   "success": true,
 *   "data": {
 *     "task": { "id": "task_xxx", "content": "...", "status": "done" },
 *     "currentStep": "reviewer",
 *     "nodeStates": [ ...5 个节点状态... ],
 *     "relatedFiles": [...],
 *     "summary": "...",
 *     "analysis": { "currentImplementation": "...", "impactScope": [...], "risks": [...] }
 *   }
 * }
 */
router.post("/run", async (req: Request, res: Response) => {
  const { content } = req.body;

  // 参数校验
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return ResponseUtil.error(res, "任务内容不能为空", 400);
  }

  if (content.trim().length > 2000) {
    return ResponseUtil.error(res, "任务内容不能超过 2000 字符", 400);
  }

  try {
    const result: WorkflowRunResponse = await runWorkflow(content.trim());
    return ResponseUtil.success(res, result);
  } catch (error) {
    console.error("[WorkflowRoute] 执行工作流异常:", error);
    return ResponseUtil.error(
      res,
      error instanceof Error ? error.message : "工作流执行异常",
      500,
    );
  }
});

export default router;
