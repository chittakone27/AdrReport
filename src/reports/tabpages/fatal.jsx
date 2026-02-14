import React, { useEffect, useState } from "react";
import { Row, Col, Table, Spin, Card } from "antd";
import { Pie } from "@ant-design/plots";
import axios from "axios";
import { useAuth } from "../../AuthContext";
import "../style/global.css"

const Fatal = ({ orgUnitId, startDate, endDate }) => {
  const { auth } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgUnitId || !startDate || !endDate) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {
          dimension: [`ou:${orgUnitId}`, "d3iJyrWjNUy.zgbblClHD7S"], // orgUnit + gender
          stage: "d3iJyrWjNUy",
          startDate,
          endDate,
          displayProperty: "NAME",
          totalPages: false,
          outputType: "EVENT",
        };

        console.log("Fetching Gender API with params:", params);

    const res = await axios.get(
  "https://dhis2.asia/laotracker/api/29/analytics/events/aggregate/AQBx2QVBvRH.json",
  {
    auth: {
      username: auth.username,
      password: auth.password,
    },
    params,
  }
);

        const rows = res.data.rows || [];
        console.log("Gender API Rows:", rows);

        // Use r[2] instead of r[3] because your rows only have 3 elements
        const rawData = rows.map((r) => {
          const Fatal = r[0] === "1" ? "Fatal" : "Unknow";
          const count = parseFloat(r[2]) || 0;
          return { Fatal, count };
        });

        const totalCount = rawData.reduce((sum, d) => sum + d.count, 0);

        const formatted = rawData.map((d) => ({
          Fatal: d.Fatal,
          count: d.count,
          percent: totalCount > 0 ? Number(((d.count / totalCount) * 100).toFixed(1)) : 0,
        }));

        setData(formatted);
      } catch (err) {
        console.error("Gender API Error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orgUnitId, startDate, endDate]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large" />
      </div>
    );

  if (!data.length)
    return <p style={{ textAlign: "center" }}>No data available for this selection.</p>;

  const pieConfig = {
    data: data.map((d) => ({ type: d.Fatal, value: d.percent })),
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    height: 350,
    label: {
      type: "inner", // changed from "outer" → works in all versions
      formatter: (datum) => `${datum.type}: ${datum.value.toFixed(1)}%`,
    },
    legend: { position: "bottom" },
  };

  const columns = [
    { title: "Fatal", dataIndex: "Fatal" },
    { title: "Count", dataIndex: "count", align: "center" },
    {
      title: "Percentage",
      align: "center",
      render: (_, r) => `${r.percent.toFixed(1)}%`,
    },
  ];

  return (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="Patient Fatal Distribution" bordered style={{ height: "100%" }}>
          <Pie {...pieConfig} />
        </Card>
      </Col>
      <Col span={10}>
        <Card title="Fatal Details" bordered style={{ height: "100%" }}>
          <Table
            size="small"
            bordered
            pagination={false}
            rowKey="Fatal"
            columns={columns}
            dataSource={data}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default Fatal;
