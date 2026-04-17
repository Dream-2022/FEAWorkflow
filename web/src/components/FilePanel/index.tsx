import { Card, Upload, List, Tag, Button, Space } from "antd";
import { InboxOutlined, FileTextOutlined } from "@ant-design/icons";
import { mockFiles } from "../../mock";
import type { UploadProps } from "antd";

const { Dragger } = Upload;

export function FilePanel() {
  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    showUploadList: false,
  };

  return (
    <Card
      title="项目文件"
      extra={
        <Button type="primary" size="small">
          上传
        </Button>
      }
    >
      <Dragger {...uploadProps} style={{ marginBottom: "16px" }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          支持 .md, .ts, .tsx, .js, .jsx, .vue 等文件
        </p>
      </Dragger>

      <List
        itemLayout="horizontal"
        dataSource={mockFiles}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <FileTextOutlined
                  style={{ fontSize: "20px", color: "#1890ff" }}
                />
              }
              title={<span style={{ fontSize: "14px" }}>{item.name}</span>}
              description={
                <Space size="small">
                  <span style={{ fontSize: "12px", color: "#999" }}>
                    {item.path}
                  </span>
                  <Tag
                    color={
                      item.parseStatus === "success" ? "success" : "processing"
                    }
                    style={{ fontSize: "12px" }}
                  >
                    {item.parseStatus === "success" ? "已解析" : "解析中"}
                  </Tag>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
