
import os

input_path = r'E:\PLAN\新建 文本文档.txt'
output_path = r'E:\PLAN\formatted_text.txt'

def read_file(path):
    encodings = ['utf-8', 'gbk', 'gb18030', 'utf-16']
    for enc in encodings:
        try:
            with open(path, 'r', encoding=enc) as f:
                return f.read(), enc
        except Exception:
            continue
    raise Exception("Could not determine encoding")

try:
    content, enc = read_file(input_path)
    print(f"Read with encoding: {enc}")
    
    # Replace Chinese punctuation with newline + punctuation
    formatted = content.replace('。', '。\n').replace('！', '！\n').replace('？', '？\n').replace('；', '；\n')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(formatted)
        
    print('File formatted successfully')
except Exception as e:
    print(f'Error: {e}')
