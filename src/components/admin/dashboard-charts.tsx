"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088fe",
  "#00C49F",
  "#FFBB28",
];

// Default data for the charts (will be replaced with real data when available)
export const defaultUserGrowthData = [
  { name: "Jan", users: 0 },
  { name: "Feb", users: 0 },
  { name: "Mar", users: 0 },
  { name: "Apr", users: 0 },
  { name: "May", users: 0 },
  { name: "Jun", users: 0 },
];

export const defaultTrackDistributionData = [
  { name: "Public", value: 0 },
  { name: "Private", value: 0 },
];

export const mockActivityData = [
  { name: "Mon", plays: 42, uploads: 5, likes: 18 },
  { name: "Tue", plays: 56, uploads: 7, likes: 24 },
  { name: "Wed", plays: 48, uploads: 3, likes: 19 },
  { name: "Thu", plays: 65, uploads: 8, likes: 27 },
  { name: "Fri", plays: 78, uploads: 12, likes: 36 },
  { name: "Sat", plays: 95, uploads: 15, likes: 48 },
  { name: "Sun", plays: 87, uploads: 10, likes: 41 },
];

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface UserGrowthData {
  name: string;
  users: number;
}

export interface APIUserGrowthData {
  _id: string; // Date in format YYYY-MM-DD
  count: number;
}

// Helper function to convert API user growth data to chart format
export const convertUserGrowthData = (
  apiData: APIUserGrowthData[]
): UserGrowthData[] => {
  if (!apiData || !apiData.length) return defaultUserGrowthData;

  return apiData.map((item) => ({
    name: item._id.split("-").slice(1).join("/"), // Convert YYYY-MM-DD to MM/DD
    users: item.count,
  }));
};

export interface ActivityData {
  name: string;
  plays: number;
  uploads: number;
  likes: number;
}

export const UserGrowthChart = ({
  data = defaultUserGrowthData,
  title = "User Growth",
}: {
  data?: UserGrowthData[];
  title?: string;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const TrackDistributionChart = ({
  data = defaultTrackDistributionData,
  title = "Track Distribution",
}: {
  data?: ChartDataPoint[];
  title?: string;
}) => {
  // Calculate total for better labeling
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) =>
                `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value} tracks (${((Number(value) / total) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const WeeklyActivityChart = ({
  data = mockActivityData,
  title = "Weekly Activity",
}: {
  data?: ActivityData[];
  title?: string;
}) => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="plays" fill="#8884d8" name="Plays" />
            <Bar dataKey="uploads" fill="#82ca9d" name="Uploads" />
            <Bar dataKey="likes" fill="#ffc658" name="Likes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Interface for active user data
export interface ActiveUserData {
  _id: string;
  username: string;
  email: string;
  songCount: number;
}

// Most active users chart component
export const MostActiveUsersChart = ({
  data = [],
  title = "Most Active Users",
}: {
  data?: ActiveUserData[];
  title?: string;
}) => {
  // Transform the data for the chart - limit to top 5 users
  const chartData = data.slice(0, 5).map((user) => ({
    name: user.username || user.email.split("@")[0],
    songs: user.songCount || 0,
  }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 60, // More space for usernames
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [`${value} tracks`, "Total Tracks"]}
            />
            <Legend />
            <Bar dataKey="songs" name="Track Count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
