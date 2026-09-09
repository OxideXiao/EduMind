import { useState } from 'react';
import { App, Upload, Button, Alert, Typography, Table, Space, Radio, Input } from 'antd';
import { InboxOutlined, DownloadOutlined, CheckOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ImportCommitResult, ImportPreviewResult, ImportResult } from '../api/types';

interface ImportUploadPanelProps {
  title?: string;
  hint?: string;
  accept?: string;
  templateUrl?: string;
  /** 一步导入（兼容）；若提供 onPreview+onCommit 则优先两步 */
  onImport?: (file: File) => Promise<ImportResult>;
  onPreview?: (
    file: File,
    opts?: { passwordMode?: 'RANDOM' | 'UNIFORM'; defaultPassword?: string },
  ) => Promise<ImportPreviewResult>;
  onCommit?: (importToken: string) => Promise<ImportCommitResult>;
  onDownloadCredential?: (token: string) => Promise<void>;
  /** 学生导入需要密码模式 */
  passwordOptions?: boolean;
  onSuccess?: (result: ImportResult | ImportCommitResult) => void;
}

/** 通用文件导入面板：支持预检 → 确认（契约两步）或一步兼容 */
export default function ImportUploadPanel({
  title = '上传文件',
  hint = '支持 CSV / Excel，单次一个文件',
  accept = '.csv,.xlsx,.xls',
  templateUrl,
  onImport,
  onPreview,
  onCommit,
  onDownloadCredential,
  passwordOptions = false,
  onSuccess,
}: ImportUploadPanelProps) {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [credentialToken, setCredentialToken] = useState<string | null>(null);
  const [passwordMode, setPasswordMode] = useState<'RANDOM' | 'UNIFORM'>('RANDOM');
  const [defaultPassword, setDefaultPassword] = useState('ChangeMe123');

  const twoStep = Boolean(onPreview && onCommit);

  const handlePreviewOrImport = async () => {
    const raw = fileList[0]?.originFileObj;
    if (!raw) {
      message.warning('请先选择文件');
      return;
    }
    setLoading(true);
    setResult(null);
    setPreview(null);
    setCredentialToken(null);
    try {
      if (twoStep && onPreview) {
        const opts = passwordOptions
          ? {
              passwordMode,
              ...(passwordMode === 'UNIFORM' ? { defaultPassword } : {}),
            }
          : undefined;
        const res = await onPreview(raw, opts);
        setPreview(res);
        if (res.errorCount > 0) {
          message.warning(`预检有 ${res.errorCount} 条错误，修正后再确认导入`);
        } else {
          message.success(`预检通过：有效 ${res.valid} / 共 ${res.total}`);
        }
      } else if (onImport) {
        const res = await onImport(raw);
        setResult(res);
        if (res.credentialExportToken) setCredentialToken(res.credentialExportToken);
        if (res.successCount > 0) message.success(`成功导入 ${res.successCount} 条`);
        if (res.failCount > 0) message.warning(`${res.failCount} 条失败，请查看明细`);
        onSuccess?.(res);
      }
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '导入失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview || !onCommit) return;
    if (preview.errorCount > 0) {
      message.error('存在错误行，无法确认导入');
      return;
    }
    setCommitting(true);
    try {
      const res = await onCommit(preview.importToken);
      const success =
        (res.created ?? 0) + (res.joined ?? 0) + (res.successCount ?? 0);
      setResult({
        successCount: success || preview.valid,
        failCount: res.failedRows?.length ?? res.failCount ?? 0,
        failures: (res.failedRows ?? []).map((r) => ({
          row: r.row,
          reason: r.reason,
          raw: r.studentNo,
        })),
        credentialExportToken: res.credentialExportToken,
        message: res.message,
      });
      if (res.credentialExportToken) setCredentialToken(res.credentialExportToken);
      message.success('导入已确认');
      onSuccess?.(res);
      setPreview(null);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '确认导入失败');
    } finally {
      setCommitting(false);
    }
  };

  const handleDownloadCred = async () => {
    if (!credentialToken || !onDownloadCredential) return;
    try {
      await onDownloadCredential(credentialToken);
      message.success('凭证已开始下载');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '下载失败');
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
            if (templateUrl.startsWith('/api/')) {
              e.preventDefault();
              window.open(templateUrl, '_blank');
            }
          }}
        >
          下载导入模板
        </Button>
      )}

      {passwordOptions && (
        <div style={{ marginBottom: 16 }}>
          <Typography.Text style={{ display: 'block', marginBottom: 8 }}>初始密码策略</Typography.Text>
          <Radio.Group
            value={passwordMode}
            onChange={(e) => setPasswordMode(e.target.value)}
            style={{ marginBottom: 8 }}
          >
            <Radio value="RANDOM">随机密码</Radio>
            <Radio value="UNIFORM">统一密码</Radio>
          </Radio.Group>
          {passwordMode === 'UNIFORM' && (
            <Input.Password
              value={defaultPassword}
              onChange={(e) => setDefaultPassword(e.target.value)}
              placeholder="统一初始密码"
              style={{ maxWidth: 280 }}
            />
          )}
        </div>
      )}

      <Upload.Dragger
        multiple={false}
        maxCount={1}
        accept={accept}
        fileList={fileList}
        beforeUpload={() => false}
        onChange={({ fileList: fl }) => {
          setFileList(fl.slice(-1));
          setPreview(null);
          setResult(null);
          setCredentialToken(null);
        }}
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">点击或拖拽文件到此处</p>
        <p className="ant-upload-hint">{accept}</p>
      </Upload.Dragger>

      <Space wrap>
        <Button type="primary" loading={loading} onClick={handlePreviewOrImport} disabled={!fileList.length}>
          {twoStep ? '预检文件' : '开始导入'}
        </Button>
        {twoStep && preview && preview.errorCount === 0 && (
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={committing}
            onClick={handleCommit}
          >
            确认导入
          </Button>
        )}
        {credentialToken && onDownloadCredential && (
          <Button icon={<DownloadOutlined />} onClick={handleDownloadCred}>
            下载账号凭证
          </Button>
        )}
      </Space>

      {preview && (
        <div style={{ marginTop: 20 }}>
          <Alert
            type={preview.errorCount ? 'warning' : 'success'}
            showIcon
            message={`预检：有效 ${preview.valid}，警告 ${preview.warningCount}，错误 ${preview.errorCount}（共 ${preview.total}）`}
            style={{ marginBottom: 12 }}
          />
          <Table
            size="small"
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            rowKey={(r) => `${r.row}-${r.status}`}
            dataSource={preview.rows}
            columns={[
              { title: '行', dataIndex: 'row', width: 64 },
              { title: '学号', dataIndex: 'studentNo', width: 100, ellipsis: true },
              { title: '姓名', dataIndex: 'realName', width: 100, ellipsis: true },
              { title: '状态', dataIndex: 'status', width: 90 },
              {
                title: '说明',
                dataIndex: 'messages',
                render: (m?: string[]) => (m?.length ? m.join('；') : '—'),
              },
            ]}
          />
        </div>
      )}

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
