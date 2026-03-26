import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "../../context/AuthContext";
import { getInventoryAnalytics, type InventoryAnalyticsData } from "../../api/inventoryAnalytics";
import { getLabSchedules } from "../../api/schedule";
import { getUserAssignedLab } from "../../api/dailyReports";
import { getLabPMCReports } from "../../api/maintenance";

interface WorkstationServiceData {
  workstation_name: string;
  serviced: number;
  unserviced: number;
  total: number;
  serviceRate: number;
  assetCount?: number;
  wellMaintainedAssetCount?: number;
}

const WorkstationServiceChart = () => {
  const [data, setData] = useState<InventoryAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLabId, setUserLabId] = useState<number | null>(null);
  const [savedSchedules, setSavedSchedules] = useState<Record<string, any>>({});
  const [activeQuarter, setActiveQuarter] = useState<string>("1st");
  const [pmcReports, setPmcReports] = useState<any[]>([]); // Add PMC reports state
  const { user } = useAuth();
  
  // Fixed fiscal year constant
  const currentFiscalYear = "2025-2026";

  // Get current quarter based on actual schedules (aligned with MaintenancePage)
  const getCurrentQuarterBasedOnSchedules = () => {
    if (!savedSchedules || Object.keys(savedSchedules).length === 0) {
      return "1st Quarter (No Schedule)";
    }

    const today = new Date();
    let currentQuarter = Object.keys(savedSchedules)[0]; // Default to first available

    // Find which quarter we are currently in based on actual schedule dates
    for (const [quarter, dates] of Object.entries(savedSchedules)) {
      const startDate = new Date((dates as any).start);
      const endDate = new Date((dates as any).end);

      // If today falls between the start and end date, this is our active quarter
      if (today >= startDate && today <= endDate) {
        currentQuarter = quarter;
        break;
      }
    }

    return `${currentQuarter} Quarter (${currentFiscalYear})`;
  };

  // Load schedules and determine active quarter based on today's date
  useEffect(() => {
    const loadSchedules = async () => {
      if (userLabId) {
        try {
          const schedules = await getLabSchedules(userLabId, currentFiscalYear);
          setSavedSchedules(schedules);

          // Automatically determine current quarter based on today's date
          if (Object.keys(schedules).length > 0) {
            const today = new Date();
            let foundQuarter = null;

            // Find which quarter contains today's date
            for (const [quarter, dates] of Object.entries(schedules)) {
              const startDate = new Date((dates as any).start);
              const endDate = new Date((dates as any).end);

              // If today falls between the start and end date, this is our active quarter
              if (today >= startDate && today <= endDate) {
                foundQuarter = quarter;
                break;
              }
            }

            // If no quarter matches today's date, find the next upcoming quarter
            if (!foundQuarter) {
              const upcomingQuarters = Object.entries(schedules)
                .filter(([, dates]) => {
                  const startDate = new Date((dates as any).start);
                  return startDate > today;
                })
                .sort(([, a], [, b]) => {
                  const dateA = new Date((a as any).start);
                  const dateB = new Date((b as any).start);
                  return dateA.getTime() - dateB.getTime();
                });

              if (upcomingQuarters.length > 0) {
                foundQuarter = upcomingQuarters[0][0];
              } else {
                // If no upcoming quarters, use the last quarter
                const allQuarters = Object.entries(schedules)
                  .sort(([, a], [, b]) => {
                    const dateA = new Date((a as any).start);
                    const dateB = new Date((b as any).start);
                    return dateB.getTime() - dateA.getTime();
                  });
                if (allQuarters.length > 0) {
                  foundQuarter = allQuarters[0][0];
                }
              }
            }

            if (foundQuarter) {
              setActiveQuarter(foundQuarter);
            }
          }
        } catch (error) {
          console.error("Failed to load schedules:", error);
        }
      }
    };

    loadSchedules();
  }, [userLabId, currentFiscalYear]);

  // Auto-refresh every hour to check for quarter changes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (userLabId) {
        loadSchedules();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(refreshInterval);
  }, [userLabId, currentFiscalYear]);

  // Helper function to reload schedules (for interval)
  const loadSchedules = async () => {
    if (userLabId) {
      try {
        const schedules = await getLabSchedules(userLabId, currentFiscalYear);
        setSavedSchedules(schedules);

        // Re-determine current quarter based on today's date
        if (Object.keys(schedules).length > 0) {
          const today = new Date();
          let foundQuarter = null;

          for (const [quarter, dates] of Object.entries(schedules)) {
            const startDate = new Date((dates as any).start);
            const endDate = new Date((dates as any).end);

            if (today >= startDate && today <= endDate) {
              foundQuarter = quarter;
              break;
            }
          }

          // If no active quarter, find next upcoming
          if (!foundQuarter) {
            const upcomingQuarters = Object.entries(schedules)
              .filter(([quarter, dates]) => {
                const startDate = new Date((dates as any).start);
                return startDate > today;
              })
              .sort(([, a], [, b]) => {
                const dateA = new Date((a as any).start);
                const dateB = new Date((b as any).start);
                return dateA.getTime() - dateB.getTime();
              });

            if (upcomingQuarters.length > 0) {
              foundQuarter = upcomingQuarters[0][0];
            }
          }

          if (foundQuarter && foundQuarter !== activeQuarter) {
            setActiveQuarter(foundQuarter);
          }
        }
      } catch (error) {
        console.error("Failed to refresh schedules:", error);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user lab info first
        const userData = await getUserAssignedLab();
        if (userData?.assigned_lab) {
          setUserLabId(userData.assigned_lab.lab_id);
        }
        
        const analyticsData = await getInventoryAnalytics();
        setData(analyticsData);

        // Determine current quarter first, then fetch PMC reports
        if (userData?.assigned_lab?.lab_id) {
          try {
            const schedules = await getLabSchedules(userData.assigned_lab.lab_id, currentFiscalYear);
            
            // Auto-detect current quarter based on today's date
            if (Object.keys(schedules).length > 0) {
              const today = new Date();
              let foundQuarter = null;

              for (const [quarter, dates] of Object.entries(schedules)) {
                const startDate = new Date((dates as any).start);
                const endDate = new Date((dates as any).end);

                if (today >= startDate && today <= endDate) {
                  foundQuarter = quarter;
                  break;
                }
              }

              if (foundQuarter) {
                setActiveQuarter(foundQuarter);
                
                // Now fetch PMC reports for the CORRECT quarter
                const pmcData = await getLabPMCReports(userData.assigned_lab.lab_id, foundQuarter);
                setPmcReports(pmcData);
              }
            }
          } catch (scheduleError) {
            console.error('Failed to load schedules:', scheduleError);
          }
        }
      } catch (err) {
        console.error("Failed to fetch inventory analytics:", err);
        setError("Failed to load workstation service data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Remove activeQuarter dependency to prevent infinite loops

  // Process data for custodian's lab only
  const workstationServiceData = useMemo(() => {
    if (!data?.timelineData) return [];

    // The backend should already be filtered for custodians, but let's ensure
    // If userLabId exists, filter by it. Otherwise, use all data (for admins)
    const labAssets = userLabId 
      ? data.timelineData.filter(asset => asset.lab_id === userLabId)
      : data.timelineData;
    
    // Group ALL timeline entries (including placeholders) by workstation
    // This ensures workstations without assets are still tracked for service
    const workstationMap = new Map<string, { assets: any[] }>();
    
    labAssets.forEach(asset => {
      const workstationName = asset.workstation_name || 'Not Assigned';
      
      if (!workstationMap.has(workstationName)) {
        workstationMap.set(workstationName, { assets: [] });
      }
      
      const current = workstationMap.get(workstationName)!;
      current.assets.push(asset);
    });

    // Determine service status for each workstation based on actual PMC reports
    const workstationData: WorkstationServiceData[] = Array.from(workstationMap.entries())
      .map(([workstationName, workstationData]) => {
        const assets = workstationData.assets;
        
        // Filter out placeholders for asset counting, but keep all for workstation tracking
        const realAssets = assets.filter(asset => asset.asset_id !== 0);
        const wellMaintainedAssets = realAssets.filter(asset => asset.timeline_position <= 2).length;
        const totalAssets = realAssets.length; // Only count real assets
        
        // Check if there's actual PMC service data for this workstation in the current quarter
        const hasServiceRecords = pmcReports.some(report => {
          // Get workstation name from the relationship
          const pmcWorkstationName = report.workstations?.workstation_name;
          
          // Try multiple matching approaches
          const matchById = report.workstation_id === assets[0]?.workstation_id;
          const matchByName = pmcWorkstationName === workstationName;
          
          // Try matching workstation_name with different formats
          const matchByNameToId = pmcWorkstationName?.toString() === workstationName;
          const matchByIdToName = report.workstation_id?.toString() === workstationName;
          
          return matchById || matchByName || matchByNameToId || matchByIdToName;
        });
        
        // Workstation is serviced only if there are actual service records
        const isServiced = hasServiceRecords;
        
        return {
          workstation_name: workstationName,
          serviced: isServiced ? 1 : 0, // Count workstation as 1 if serviced
          unserviced: isServiced ? 0 : 1, // Count workstation as 1 if unserviced
          total: 1, // Each workstation counts as 1
          serviceRate: isServiced ? 100 : 0, // Either 100% serviced or 0% serviced
          assetCount: totalAssets, // Keep asset count for reference
          wellMaintainedAssetCount: wellMaintainedAssets
        };
      })
      .filter(item => item.total > 0) // Include all entries for asset counting
      .sort((a, b) => b.serviceRate - a.serviceRate); // Sort by service rate (serviced first)

    return workstationData;
  }, [data, userLabId, pmcReports]);

  // Create separate data for workstation counting (exclude "Not Assigned")
  const actualWorkstations = useMemo(() => {
    return workstationServiceData.filter(ws => ws.workstation_name !== 'Not Assigned');
  }, [workstationServiceData]);

  // Create summary data for the chart
  const chartData = useMemo(() => {
    if (workstationServiceData.length === 0) {
      return [
        { category: 'Serviced Workstations', count: 0, percentage: 0, fill: '#10b981' },
        { category: 'Pending Service Workstations', count: 0, percentage: 0, fill: '#ef4444' }
      ];
    }

    const servicedCount = actualWorkstations.filter(ws => ws.serviced === 1).length;
    const pendingCount = actualWorkstations.filter(ws => ws.unserviced === 1).length;
    
    return [
      {
        category: 'Serviced Workstations',
        count: servicedCount,
        percentage: actualWorkstations.length > 0 ? (servicedCount / actualWorkstations.length) * 100 : 0,
        fill: '#10b981'
      },
      {
        category: 'Pending Service Workstations', 
        count: pendingCount,
        percentage: actualWorkstations.length > 0 ? (pendingCount / actualWorkstations.length) * 100 : 0,
        fill: '#ef4444'
      }
    ];
  }, [actualWorkstations]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (workstationServiceData.length === 0) {
      return {
        totalWorkstations: 0,
        totalAssets: 0,
        totalServiced: 0,
        totalUnserviced: 0,
        averageServiceRate: 0
      };
    }

    const servicedWorkstations = actualWorkstations.filter(ws => ws.serviced === 1).length;
    const unservicedWorkstations = actualWorkstations.filter(ws => ws.unserviced === 1).length;
    
    // Use lab data total for accurate asset count (includes assets without purchase dates)
    // Fall back to timeline calculation if lab data is not available
    const labTotalAssets = data?.labStatusData?.[0]?.total || 0;
    const timelineTotalAssets = workstationServiceData.reduce((sum, ws) => sum + (ws.assetCount || 0), 0);
    const totalAssets = labTotalAssets > 0 ? labTotalAssets : timelineTotalAssets;

    return {
      totalWorkstations: actualWorkstations.length,
      totalAssets: totalAssets,
      totalServiced: servicedWorkstations,
      totalUnserviced: unservicedWorkstations,
      averageServiceRate: actualWorkstations.length > 0 ? (servicedWorkstations / actualWorkstations.length) * 100 : 0
    };
  }, [workstationServiceData, actualWorkstations]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Quarter Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Quarter Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (workstationServiceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Quarter Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No workstation data available for current quarter</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.category}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Count:</span>
              <span className="font-medium">{data.count}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-900">Percentage:</span>
              <span className="font-medium">{data.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2">
          <CardTitle className="text-lg">Current Quarter Service Status</CardTitle>
          <p className="text-sm text-gray-600">
            Workstation service performance for {getCurrentQuarterBasedOnSchedules()}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summaryStats.totalWorkstations}</div>
            <div className="text-xs text-blue-600 font-medium">Workstations</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{summaryStats.totalAssets}</div>
            <div className="text-xs text-gray-600 font-medium">Total Assets</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summaryStats.totalServiced}</div>
            <div className="text-xs text-green-600 font-medium">Serviced</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summaryStats.totalUnserviced}</div>
            <div className="text-xs text-red-600 font-medium">Pending Service</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summaryStats.averageServiceRate.toFixed(1)}%</div>
            <div className="text-xs text-purple-600 font-medium">Service Coverage</div>
          </div>
        </div>

        {/* Percentage Breakdown Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height={256}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="category"
                stroke="#6b7280"
                fontSize={12}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="percentage" 
                fill="url(#colorGradient)"
                name="Percentage"
                radius={[8, 8, 0, 0]}
                label={({ value }) => `${Number(value).toFixed(1)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Indicators */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Service Status Breakdown - {getCurrentQuarterBasedOnSchedules()}</span>
              </div>
            </div>
            <div className="text-gray-500">
              {summaryStats.totalServiced} of {summaryStats.totalWorkstations} workstations serviced ({summaryStats.averageServiceRate.toFixed(1)}%)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkstationServiceChart;
