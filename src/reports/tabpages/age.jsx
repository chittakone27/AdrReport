import React, { useEffect, useState } from "react";
import { Bar } from "@ant-design/plots";
import { Row, Col, Table, Spin, Card } from "antd";
// import { useAuth } from "../../AuthContext"; // make sure path is correct
import "../style/global.css"

const AgePage = ({ orgUnitId, startDate, endDate }) => {
  // const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1️⃣ Fetch data
  useEffect(() => {
    // if (!auth?.username || !auth?.password) return;

    // const authHeader = "Basic " + btoa(`${auth.username}:${auth.password}`);

    fetch(
      `https://dhis2.asia/laotracker/api/29/analytics/events/query/AQBx2QVBvRH.json?&dimension=ou:${orgUnitId}&dimension=d3iJyrWjNUy.UHoBhxTMPuR&dimension=d3iJyrWjNUy.ENqg722pqNJ&dimension=d3iJyrWjNUy.SM6PGmEgqbV&stage=d3iJyrWjNUy&startDate=${startDate}&endDate=${endDate}&displayProperty=NAME&totalPages=false&outputType=EVENT&desc=eventdate&paging=false`,
      {
        headers: {
          // Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Auth failed");
        return res.json();
      })
      .then((data) => {
        setRows(data.rows || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setRows([]);
        setLoading(false);
      });
  // }, [auth]);
    });



// Convert days/months/years to decimal years
const convertToYears = (years, months, days) => {
  const y = parseFloat(years);
  const m = parseFloat(months);
  const d = parseFloat(days);

  // If all are missing or invalid, return null
  if (isNaN(y) && isNaN(m) && isNaN(d)) return null;

  return (isNaN(y) ? 0 : y) + (isNaN(m) ? 0 : m / 12) + (isNaN(d) ? 0 : d / 365);
};

// Map age in years to age group
const getAgeGroup = (ageInYears) => {
  if (ageInYears === null) return "Unknown"; // handle missing age
  if (ageInYears <= 0.07) return "0 - 27 days";
  if (ageInYears < 2) return "28 days to 23 months";
  if (ageInYears <= 11) return "2 - 11 years";
  if (ageInYears <= 17) return "12 - 17 years";
  if (ageInYears <= 44) return "18 - 44 years";
  if (ageInYears <= 64) return "45 - 64 years";
  if (ageInYears <= 74) return "65 - 74 years";
  return "≥ 75 years";
};

// 3️⃣ Aggregate rows by age group
const ageMap = {};
rows.forEach((row) => {
  const ageInYears = convertToYears(row[22], row[21], row[23]);
  const group = getAgeGroup(ageInYears);
  ageMap[group] = (ageMap[group] || 0) + 1;
});

// Define the order of age groups
const ageGroupOrder = [
  "0 - 27 days",
  "28 days to 23 months",
  "2 - 11 years",
  "12 - 17 years",
  "18 - 44 years",
  "45 - 64 years",
  "65 - 74 years",
  "≥ 75 years",
    "Unknown",

];

// Convert ageMap to table/chart data in proper order
const tableData = ageGroupOrder
  .filter((group) => ageMap[group]) // only include groups with data
  .map((group) => ({
    age: group,
    count: ageMap[group],
  }));

const total = tableData.reduce((s, d) => s + d.count, 0);

const chartData = tableData.map((d) => ({
  ...d,
  percent: Number(((d.count / total) * 100).toFixed(1)),
}));


  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );

  if (!chartData.length)
    return <p style={{ textAlign: "center" }}>No data available for this selection.</p>;

  const chartConfig = {
    data: chartData,
    xField: "age",
    yField: "percent",
    legend: false,
    height: 400,
    yAxis: {
      label: { formatter: (v) => `${v}%` },
    },
  };

  const columns = [
    { title: "Age Group", dataIndex: "age" },
    { title: "Count", dataIndex: "count", align: "center" },
    {
      title: "Percentage",
      align: "center",
      render: (_, r) => `${((r.count / total) * 100).toFixed(1)}%`,
    },
  ];

  return (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="Patient Age Distribution">
          <Bar {...chartConfig} />
        </Card>
      </Col>

      <Col span={10}>
        <Card title="Patient Age Detail">
          <Table
            size="small"
            bordered
            pagination={false}
            rowKey="age"
            columns={columns}
            dataSource={tableData}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default AgePage;
