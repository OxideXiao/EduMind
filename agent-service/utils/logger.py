"""统一日志配置"""
from loguru import logger as _logger
import sys
import os

# 移除默认handler
_logger.remove()

# Windows终端可能用GBK编码，强制UTF-8或忽略编码错误
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# 添加控制台输出（去掉颜色避免Windows编码问题，用纯文本）
_logger.add(
    sys.stdout,
    format="{time:HH:mm:ss} | {level: <8} | {name}:{function} - {message}",
    level="INFO",
    colorize=False,
)

# 确保logs目录存在
os.makedirs("logs", exist_ok=True)

# 添加文件日志
_logger.add(
    "logs/agent_{time:YYYY-MM-DD}.log",
    rotation="00:00",
    retention="7 days",
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
    level="DEBUG",
)

logger = _logger
