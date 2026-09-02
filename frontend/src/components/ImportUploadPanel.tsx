import { useState } from 'react';
import { App, Upload, Button, Alert, Typography, Table } from 'antd';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ImportResult } from '../api/types';

interface ImportUploadPanelProps {
  title?: string;
  hint?: string;
  accept?: string;
  templateUrl?: string;
  onImport: (file: File) => Promise<ImportResult>;
  onSuccess?: (result: ImportResult) => void;
}

/** 通用文件导入面板（学生名单 / 知识点 / 题库） */
export default function ImportUploadPanel({
  title = '上传文件',
  hint = '支持 CSV / Excel，单次一个文件',
  accept = '.csv,.xlsx,.xls',
  templateUrl,
  onImport,
  onSuccess,
}: ImportUploadPanelProps) {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    const raw = fileList[0]?.originFileObj;
    if (!raw) {
      message.warning('请先选择文件');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await onImport(raw);
      setResult(res);
      if (res.successCount > 0) message.success(`成功导入 ${res.successCount} 条`);
      if (res.failCount > 0) message.warning(`${res.failCount} 条失败，请查看明细`);
      onSuccess?.(res);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '导入失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Typography.Title level={5} style={{ marginTop: 0 }}>{title}</Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {hint}
      </Typography.Paragraph>

      {templateUrl && (
        <Button
          type="link"
          icon={<DownloadOutlined />}
          href={templateUrl}
          style={{ paddingLeft: 0, marginBottom: 8 }}
          onClick={(e) => {
            // 模板接口未就绪时避免跳空白
            if (templateUrl.startsWith('/api/')) {
              e.preventDefault();
              message.info('模板下载接口待后端提供，联调后可直接下载');
            }
          }}
        >
          下载导入模板
        </Button>
      )}

      <Upload.Dragger
        multiple={false}
        maxCount={1}
        accept={accept}
        fileList={fileList}
        beforeUpload={() => false}
        onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">点击或拖拽文件到此处</p>
        <p className="ant-upload-hint">{accept}</p>
      </Upload.Dragger>

      <Button type="primary" loading={loading} onClick={handleImport} disabled={!fileList.length}>
        开始导入
      </Button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <Alert
            type={result.failCount ? 'warning' : 'success'}
            showIcon
            message={`成功 ${result.successCount} 条，失败 ${result.failCount} 条`}
            description={result.message}
            style={{ marginBottom: 12 }}
          />
          {result.failures?.length > 0 && (
            <Table
              size="small"
              pagination={false}
              rowKey={(r) => `${r.row}-${r.reason}`}
              dataSource={result.failures}
              columns={[
                { title: '行号', dataIndex: 'row', width: 80 },
                { title: '原因', dataIndex: 'reason' },
                { title: '原始内容', dataIndex: 'raw', ellipsis: true },
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
}
