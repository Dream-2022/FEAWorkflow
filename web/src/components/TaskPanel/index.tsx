import { Card, Form, Input, Button, Steps, Tag, Space } from "antd";
import { mockTask, mockWorkflowNodes } from "../../mock";

const { TextArea } = Input;

export function TaskPanel() {
  const [form] = Form.useForm();

  const getStepStatus = (status: string) => {
    switch (status) {
      case "success":
        return "finish";
      case "running":
        return "process";
      case "error":
        return "error";
      default:
        return "wait";
    }
  };

  return (
    <Card title="任务执行">
      <Form form={form} layout="vertical" style={{ marginBottom: "24px" }}>
        <Form.Item label="输入任务" name="task">
          <TextArea
            rows={4}
            placeholder="例如：为 Switch 组件新增 loading 与 disabled 联动能力..."
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" block size="large">
            开始分析
          </Button>
        </Form.Item>
      </Form>

      <Card
        type="inner"
        title="工作流节点"
        style={{ marginBottom: "24px" }}
        size="small"
      >
        <Steps
          orientation="vertical"
          size="small"
          current={mockWorkflowNodes.findIndex((n) => n.status === "running")}
          items={mockWorkflowNodes.map((node) => ({
            title: node.nodeName,
            status: getStepStatus(node.status),
            description: node.durationMs ? `${node.durationMs}ms` : undefined,
          }))}
        />
      </Card>

      <Card type="inner" title="当前任务" size="small">
        <Space orientation="vertical" style={{ width: "100%" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>
            {mockTask.content}
          </p>
          <Tag color={mockTask.status === "running" ? "processing" : "default"}>
            {mockTask.status === "running" ? "执行中" : mockTask.status}
          </Tag>
        </Space>
      </Card>
    </Card>
  );
}
