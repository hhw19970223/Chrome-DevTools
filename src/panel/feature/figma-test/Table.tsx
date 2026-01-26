import { Table as MantineTable, Button, Badge, Stack, Title } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import * as XLSX from 'xlsx';

// 数据类型定义
interface TestCase {
  功能模块: string;
  一级菜单: string;
  前提: string;
  功能说明: string;
  测试内容: string;
  预期结果: string;
  优先级: string;
}

interface FunctionPoint {
  pointName: string;
  description: string;
  testCases: {
    positive: TestCase[];
    negative: TestCase[];
  };
}

interface Module {
  moduleName: string;
  functionPoints: FunctionPoint[];
}

interface TestCaseData {
  modules: Module[];
}

interface TableProps {
  data: TestCaseData;
}

// 将嵌套数据扁平化为表格行
interface FlattenedRow extends TestCase {
  模块名称: string;
  功能点名称: string;
  功能点描述: string;
  用例类型: string;
}

export function Table({ data }: TableProps) {
  // 扁平化数据
  const flattenData = (): FlattenedRow[] => {
    const rows: FlattenedRow[] = [];
    
    if (!data || !data.modules) return rows;
    
    data.modules.forEach(module => {
      module.functionPoints.forEach(point => {
        // 处理正向用例
        point.testCases.positive.forEach(testCase => {
          rows.push({
            模块名称: module.moduleName,
            功能点名称: point.pointName,
            功能点描述: point.description,
            用例类型: '正向用例',
            ...testCase
          });
        });
        
        // 处理反向用例
        point.testCases.negative.forEach(testCase => {
          rows.push({
            模块名称: module.moduleName,
            功能点名称: point.pointName,
            功能点描述: point.description,
            用例类型: '反向用例',
            ...testCase
          });
        });
      });
    });
    
    return rows;
  };

  const flattenedData = flattenData();

  // 导出为 Excel
  const exportToExcel = () => {
    if (!flattenedData.length) {
      return;
    }

    // 准备导出数据
    const exportData = flattenedData.map((row, index) => ({
      '序号': index + 1,
      '模块名称': row.模块名称,
      '功能点名称': row.功能点名称,
      '功能点描述': row.功能点描述,
      '用例类型': row.用例类型,
      '功能模块': row.功能模块,
      '一级菜单': row.一级菜单,
      '前提': row.前提,
      '功能说明': row.功能说明,
      '测试内容': row.测试内容,
      '预期结果': row.预期结果,
      '优先级': row.优先级,
    }));

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // 设置列宽
    const colWidths = [
      { wch: 6 },  // 序号
      { wch: 20 }, // 模块名称
      { wch: 20 }, // 功能点名称
      { wch: 30 }, // 功能点描述
      { wch: 12 }, // 用例类型
      { wch: 20 }, // 功能模块
      { wch: 20 }, // 一级菜单
      { wch: 30 }, // 前提
      { wch: 30 }, // 功能说明
      { wch: 40 }, // 测试内容
      { wch: 40 }, // 预期结果
      { wch: 8 },  // 优先级
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '测试用例');

    // 下载文件
    const fileName = `测试用例_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0':
        return 'red';
      case 'P1':
        return 'orange';
      case 'P2':
        return 'blue';
      default:
        return 'gray';
    }
  };

  // 获取用例类型颜色
  const getTestTypeColor = (type: string) => {
    return type === '正向用例' ? 'green' : 'grape';
  };

  if (!flattenedData.length) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: '200px' }}>
        <Title order={4} c="dimmed">暂无数据</Title>
      </Stack>
    );
  }

  return (
    <div className='flex flex-col gap-4 h-full w-full overflow-hidden'>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title order={3}>测试用例列表</Title>
        <Button 
          leftSection={<IconDownload size={16} />}
          onClick={exportToExcel}
        >
          导出 Excel
        </Button>
      </div>

      <div style={{ overflow: 'auto' }}>
        <MantineTable striped highlightOnHover withTableBorder withColumnBorders>
          <MantineTable.Thead>
            <MantineTable.Tr>
              <MantineTable.Th>序号</MantineTable.Th>
              <MantineTable.Th>模块名称</MantineTable.Th>
              <MantineTable.Th>功能点名称</MantineTable.Th>
              <MantineTable.Th>功能点描述</MantineTable.Th>
              <MantineTable.Th>用例类型</MantineTable.Th>
              <MantineTable.Th>功能模块</MantineTable.Th>
              <MantineTable.Th>一级菜单</MantineTable.Th>
              <MantineTable.Th>前提</MantineTable.Th>
              <MantineTable.Th>功能说明</MantineTable.Th>
              <MantineTable.Th>测试内容</MantineTable.Th>
              <MantineTable.Th>预期结果</MantineTable.Th>
              <MantineTable.Th>优先级</MantineTable.Th>
            </MantineTable.Tr>
          </MantineTable.Thead>
          <MantineTable.Tbody>
            {flattenedData.map((row, index) => (
              <MantineTable.Tr key={index}>
                <MantineTable.Td>{index + 1}</MantineTable.Td>
                <MantineTable.Td>{row.模块名称}</MantineTable.Td>
                <MantineTable.Td>{row.功能点名称}</MantineTable.Td>
                <MantineTable.Td>{row.功能点描述}</MantineTable.Td>
                <MantineTable.Td>
                  <Badge color={getTestTypeColor(row.用例类型)} variant="light">
                    {row.用例类型}
                  </Badge>
                </MantineTable.Td>
                <MantineTable.Td>{row.功能模块}</MantineTable.Td>
                <MantineTable.Td>{row.一级菜单}</MantineTable.Td>
                <MantineTable.Td>{row.前提}</MantineTable.Td>
                <MantineTable.Td>{row.功能说明}</MantineTable.Td>
                <MantineTable.Td>{row.测试内容}</MantineTable.Td>
                <MantineTable.Td>{row.预期结果}</MantineTable.Td>
                <MantineTable.Td>
                  <Badge color={getPriorityColor(row.优先级)} variant="filled">
                    {row.优先级}
                  </Badge>
                </MantineTable.Td>
              </MantineTable.Tr>
            ))}
          </MantineTable.Tbody>
        </MantineTable>
      </div>

      <div style={{ textAlign: 'right', color: '#666' }}>
        共 {flattenedData.length} 条测试用例
      </div>
    </div>
  );
}