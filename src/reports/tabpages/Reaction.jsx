import React, { useEffect, useState } from "react";
import { Bar } from "@ant-design/plots";
import { Row, Col, Table, Spin, Card } from "antd";
import { useAuth } from "../../AuthContext";
import "../style/global.css";

const Reaction = ({ orgUnitId, startDate, endDate }) => {
  const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const [metaData, setMetaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth?.username || !auth?.password) return;

    const authHeader = "Basic " + btoa(`${auth.username}:${auth.password}`);
    const url = `https://dhis2.asia/laotracker/api/29/analytics/events/aggregate/AQBx2QVBvRH.json?dimension=ou:${orgUnitId}&dimension=d3iJyrWjNUy.bCa0xvLA6jN&stage=d3iJyrWjNUy&startDate=${startDate}&endDate=${endDate}&displayProperty=NAME&totalPages=false&outputType=EVENT`;

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
  }, [auth, orgUnitId, startDate, endDate]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );

  if (!metaData || !rows.length)
    return <p style={{ textAlign: "center" }}>No data available.</p>;

  // 1️⃣ Map MedDRA codes to names
  const meddraMap = {};
  Object.entries(metaData.items).forEach(([key, item]) => {
    meddraMap[item.code] = item.name;
  });

  // 2️⃣ Prepare data: only rows with value > 0, map code → name
  const tableData = rows
    .filter((r) => Number(r[2]) > 0)
    .map((r) => ({
meddra: meddraMap[r[0]] ? meddraMap[r[0]] : "N/A",
      orgUnitId: r[1],
      value: Number(r[2]),
    }));

  const total = tableData.reduce((sum, r) => sum + r.value, 0);

  const chartData = tableData.map((d) => ({
    ...d,
    percent: total ? Number(((d.value / total) * 100).toFixed(1)) : 0,
  }));

  // 3️⃣ Chart configuration
  const chartConfig = {
    data: chartData,
    xField: "meddra",
    yField: "percent",
    legend: false,
    height: 400,
    xAxis: {
      label: {
        style: {
          fontFamily: "'Noto Sans Lao', sans-serif",
          fontSize: 12,
        },
        autoRotate: true,
        autoHide: true,
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
  };

  // 4️⃣ Table columns
  const columns = [
    { title: "Reaction", dataIndex: "meddra" },
    { title: "Event Count", dataIndex: "value", align: "center" },
    {
      title: "Percentage",
      dataIndex: "percent",
      align: "center",
      render: (percent) => `${percent}%`,
    },
  ];

  return (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="Reaction Distribution">
          <Bar {...chartConfig} />
        </Card>
      </Col>
      <Col span={10}>
        <Card title="Reaction Details">
          <Table
            size="small"
            bordered
            pagination={false}
            rowKey="meddra"
            columns={columns}
            dataSource={chartData}
            summary={(pageData) => {
              const totalValue = pageData.reduce((sum, item) => sum + item.value, 0);
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell>
                    <b>Total</b>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell align="center">
                    <b>{totalValue}</b>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell align="center">
                    <b>100%</b>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default Reaction;
