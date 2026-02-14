import React, { useEffect, useState } from "react";
import { Bar } from "@ant-design/plots";
import { Row, Col, Table, Spin, Card } from "antd";
import { useAuth } from "../../AuthContext";
import "../style/global.css"

const ProvinceEventPage = ({ orgUnitId, orgUnitLevel, startDate, endDate }) => {
  const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metaData, setMetaData] = useState(null);

  // Top-level org unit mapping
  const orgUnitMap = {
    1: "jblbYwuvO33",
    2: "Zh1inFu0Z2O",
  };

  useEffect(() => {
    if (!auth?.username || !auth?.password) return;

    const topLevelId = orgUnitMap[orgUnitLevel];
    if (!topLevelId) return;

    const authHeader = "Basic " + btoa(`${auth.username}:${auth.password}`);

    const url = `https://dhis2.asia/laotracker/api/29/analytics/events/aggregate/AQBx2QVBvRH.json?dimension=ou:OU_GROUP-${topLevelId};${orgUnitId}&stage=d3iJyrWjNUy&startDate=${startDate}&endDate=${endDate}&displayProperty=NAME&totalPages=false&outputType=EVENT`;

    fetch(url, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Auth failed");
        return res.json();
      })
      .then((data) => {
        setRows(data.rows || []);
        setMetaData(data.metaData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setRows([]);
        setMetaData(null);
        setLoading(false);
      });
  }, [auth, orgUnitLevel, orgUnitId, startDate, endDate]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );



  // 1️⃣ Build full list of provinces
  const allProvinces = metaData.dimensions.ou.map((id) => ({
    id,
    name: metaData.items[id]?.name || id,
  }));

  // 2️⃣ Map API rows for quick lookup
  const rowMap = Object.fromEntries(rows.map((r) => [r[0], Number(r[1])]));

  // 3️⃣ Build final table/chart data, fill missing provinces with 0
  const tableData = allProvinces.map((p) => ({
    orgUnit: p.name,
    value: rowMap[p.id] || 0,
  }));

  // 4️⃣ Sort A → Z by province name
  tableData.sort((a, b) => a.orgUnit.localeCompare(b.orgUnit, "en", { sensitivity: "base" }));

  const total = tableData.reduce((sum, r) => sum + r.value, 0);

  const chartData = tableData.map((d) => ({
    ...d,
    percent: total ? Number(((d.value / total) * 100).toFixed(1)) : 0,
  }));

 const chartConfig = {
  data: chartData,
  xField: "orgUnit",
  yField: "percent",
  legend: false,
  height: 400,
  xAxis: {
    label: {
      style: {
        fontFamily: "'Noto Sans Lao', sans-serif",
        fontSize: 120,
      },
    },
  },
  yAxis: {
    label: {
      formatter: (v) => `${v}%`,
      style: {
        fontFamily: "'Noto Sans Lao', sans-serif",
        fontSize: 12,
      },
    },
  },
  meta: {
    orgUnit: { alias: "Province" },
    percent: { alias: "Percentage" },
  },
};


  const columns = [
    { title: "Province", dataIndex: "orgUnit" },
    { title: "Event Count", dataIndex: "value", align: "center" },
    {
      title: "Percentage",
      dataIndex: "percent",
      align: "center",
      render: (percent) => `${percent}%`,
    },
  ];
  if (!metaData)
    return <p style={{ textAlign: "center" }}>No data available.</p>;
  return (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="Event Distribution by Province">
          <Bar {...chartConfig} />
        </Card>
      </Col>
      <Col span={10}>
        <Card title="Province Event Details">
    <Table
  size="small"
  bordered
  pagination={false}
  rowKey="orgUnit"
  columns={columns}
  dataSource={chartData}
  summary={(pageData) => {
    const totalValue = pageData.reduce((sum, item) => sum + item.value, 0);
    return (
      <Table.Summary.Row>
        <Table.Summary.Cell><b>Total</b></Table.Summary.Cell>
        <Table.Summary.Cell align="center"><b>{totalValue}</b></Table.Summary.Cell>
        <Table.Summary.Cell align="center"><b>100%</b></Table.Summary.Cell>
      </Table.Summary.Row>
    );
  }}
/>

        </Card>
      </Col>
    </Row>
  );
};

export default ProvinceEventPage;
