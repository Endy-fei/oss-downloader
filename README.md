# aliyunoss-downloader

一个简单的 npm 包工具，用于从阿里云 OSS 批量下载文件。

## 安装

```bash
npm install -g aliyunoss-downloader
```
# 或者使用:

```bash
npx aliyunoss-downloader --bucket your-bucket \
  --region oss-cn-hangzhou \
  --accessKeyId xxx \
  --accessKeySecret xxx \
  --objectNames file1.txt,file2.jpg \
  --localPath ./downloads
```

## 配置文件

```json
// aliyunoss.config.jsonc
{
  // OSS 存储空间
  "bucket": "********",
  // 所在区域
  "region": "oss-cn-beijing",
  // 访问密钥
  "accessKeyId": "**************",
  "accessKeySecret": "******************",
  // 要下载的对象列表
  "objectNames": ["jar_sync/four-lines-one-database-2.0.3.jar"],
  // 本地保存路径
  "localPath": "./out"
}
```