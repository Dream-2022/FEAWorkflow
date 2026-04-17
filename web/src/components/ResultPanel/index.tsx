import { Card, List, Typography, Collapse, Tag, Button, Space } from "antd";
import {
  CopyOutlined,
  FileTextOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import { mockTaskResult } from "../../mock";

const { Text, Paragraph, Title } = Typography;
const { Panel } = Collapse;

export function ResultPanel() {
  return (
    <Space orientation="vertical" style={{ width: "100%" }} size="middle">
      <Card
        title="涉及文件"
        extra={
          <Tag color="blue">
            {mockTaskResult.relatedFiles?.length || 0} 个文件
          </Tag>
        }
      >
        <List
          dataSource={mockTaskResult.relatedFiles}
          renderItem={(item) => (
            <List.Item>
              <FileTextOutlined
                style={{ marginRight: "8px", color: "#1890ff" }}
              />
              <Text code>{item}</Text>
            </List.Item>
          )}
        />
      </Card>

      <Card title="当前实现分析">
        <Paragraph>{mockTaskResult.analysis}</Paragraph>
      </Card>

      <Card title="推荐改动方案">
        <List
          dataSource={mockTaskResult.suggestions}
          renderItem={(item) => (
            <List.Item>
              <Tag color="success">方案</Tag>
              <Text>{item}</Text>
            </List.Item>
          )}
        />
      </Card>

      <Card
        title="风险点"
        extra={<AlertOutlined style={{ color: "#faad14" }} />}
      >
        <List
          dataSource={mockTaskResult.risks}
          renderItem={(item) => (
            <List.Item>
              <Tag color="warning">风险</Tag>
              <Text type="secondary">{item}</Text>
            </List.Item>
          )}
        />
      </Card>

      <Card
        title="文档草稿"
        extra={
          <Button icon={<CopyOutlined />} size="small">
            复制
          </Button>
        }
      >
        <Card type="inner" style={{ background: "#fafafa" }}>
          <pre style={{ margin: 0, fontSize: "13px", whiteSpace: "pre-wrap" }}>
            {mockTaskResult.docDraft}
          </pre>
        </Card>
      </Card>

      <Collapse
        defaultActiveKey={["1"]}
        items={[
          {
            key: "1",
            label: "下一步建议",
            children: (
              <Space orientation="vertical" style={{ width: "100%" }}>
                {mockTaskResult.nextSteps.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "#fafafa",
                    }}
                  >
                    <Tag color="blue">{index + 1}</Tag>
                    <Text>{item}</Text>
                  </div>
                ))}
              </Space>
            ),
          },
        ]}
      />
    </Space>
  );
}
