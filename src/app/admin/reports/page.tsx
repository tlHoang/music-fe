"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { LuMessageSquareMore, LuSearch, LuFlag } from "react-icons/lu";

interface Report {
  _id: string;
  reason: string; // INAPPROPRIATE_CONTENT, COPYRIGHT_INFRINGEMENT, SPAM, HARASSMENT, OTHER
  status: string; // PENDING, REVIEWED, DISMISSED
  description: string;
  reportedBy?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  songId?: {
    _id: string;
    title: string;
    artist: string;
  };
  createdAt: string;
  updatedAt?: string;
  reviewedBy?: {
    _id: string;
    name: string;
  };
  reviewNotes?: string;
}

const ReportsPage = () => {
  const { data: session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [flagTrack, setFlagTrack] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const reportsPerPage = 10;
  const totalPages = Math.ceil(totalReports / reportsPerPage);

  // Fetch reports data
  const fetchReports = async () => {
    if (!session?.user?.access_token) return;

    try {
      setIsLoading(true);

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: reportsPerPage.toString(),
      });

      if (typeFilter !== "all") {
        queryParams.append("type", typeFilter);
      }

      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/songs/admin/flag-reports?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Handle different API response structures
      if (data && data.data && data.data.data && data.data.data.reports) {
        // Backend returns: { statusCode, message, data: { success, data: { reports, pagination } } }
        setReports(data.data.data.reports);
        setTotalReports(
          data.data.data.pagination?.total || data.data.data.reports.length
        );
      } else if (data && data.data && data.data.reports) {
        // Fallback: { data: { reports, pagination } }
        setReports(data.data.reports);
        setTotalReports(
          data.data.pagination?.total || data.data.reports.length
        );
      } else if (data && Array.isArray(data.data)) {
        setReports(data.data);
        setTotalReports(data.totalCount || data.data.length);
      } else if (data && Array.isArray(data)) {
        setReports(data);
        setTotalReports(data.length);
      } else {
        console.error("Unexpected data structure:", data);
        toast.error("Invalid data format received");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [session, currentPage, typeFilter, statusFilter]);
  // Filter reports based on search query
  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true;

    return (
      report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportedBy?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      report.songId?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false
    );
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  }; // View report details
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setResolutionNote(report.reviewNotes || "");
    setFlagTrack(false); // Reset flag track checkbox
    setIsDetailOpen(true);
  };

  // Update report status
  const handleUpdateStatus = async (status: string) => {
    if (!selectedReport || !session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/songs/admin/flag-reports/${selectedReport._id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify({
            status,
            reviewNotes: resolutionNote,
            flagSong: flagTrack, // Include the flag track option
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success(`Report marked as ${status.toLowerCase()}`); // Update local state
      setReports(
        reports.map((report) =>
          report._id === selectedReport._id
            ? { ...report, status, reviewNotes: resolutionNote }
            : report
        )
      );

      setIsDetailOpen(false);
    } catch (error) {
      console.error(`Error updating report status:`, error);
      toast.error("Failed to update report status");
    }
  };
  // Get color for reason badge
  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "INAPPROPRIATE_CONTENT":
        return "bg-red-100 text-red-800 border-red-300";
      case "COPYRIGHT_INFRINGEMENT":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "SPAM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "HARASSMENT":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "OTHER":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Get color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "REVIEWED":
        return "bg-green-100 text-green-800 border-green-300";
      case "DISMISSED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            Manage user-submitted reports and content moderation.
          </p>
        </div>
      </div>
      {/* Search and Filter UI */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <LuSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search reports..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>{" "}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Report Reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            <SelectItem value="INAPPROPRIATE_CONTENT">
              Inappropriate Content
            </SelectItem>
            <SelectItem value="COPYRIGHT_INFRINGEMENT">Copyright</SelectItem>
            <SelectItem value="SPAM">Spam</SelectItem>
            <SelectItem value="HARASSMENT">Harassment</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REVIEWED">Reviewed</SelectItem>
            <SelectItem value="DISMISSED">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchReports}>Refresh</Button>
      </div>{" "}
      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Reason</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Reporter</TableHead>
                <TableHead className="hidden lg:table-cell">Track</TableHead>
                <TableHead className="hidden xl:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeletons
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[200px]" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-[100px]" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-[120px]" />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell>
                      <Badge
                        className={`${getReasonColor(report.reason)} border font-medium`}
                      >
                        {report.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {report.description}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {report.reportedBy ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={report.reportedBy.profilePicture}
                            />
                            <AvatarFallback>
                              {report.reportedBy.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            {report.reportedBy.name}
                          </span>
                        </div>
                      ) : (
                        "Anonymous"
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          TRACK
                        </span>
                        <span className="truncate">
                          {report.songId?.title || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {formatDate(report.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(report.status)} border font-medium`}
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <LuMessageSquareMore className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>{" "}
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewReport(report)}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {report.songId && (
                            <DropdownMenuItem asChild>
                              <a href={`/track/${report.songId._id}`}>
                                View Track
                              </a>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No reports found matching the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show only nearby pages when there are many pages
                if (totalPages <= 5) return true;
                return (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                );
              })
              .map((page, index, array) => {
                // Add ellipsis
                if (index > 0 && page > array[index - 1] + 1) {
                  return (
                    <div key={`ellipsis-${page}`} className="flex space-x-1">
                      <span className="flex items-center justify-center px-2">
                        ...
                      </span>
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </div>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
      {/* Report Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Review report information and take action.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-4">
              {" "}
              {/* Report Type and Status */}
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <Badge
                  className={`${getReasonColor(selectedReport.reason)} border font-medium`}
                >
                  {selectedReport.reason}
                </Badge>
                <Badge
                  className={`${getStatusColor(selectedReport.status)} border font-medium`}
                >
                  {selectedReport.status}
                </Badge>
              </div>
              {/* Description */}
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="whitespace-pre-wrap">
                  {selectedReport.description}
                </p>
              </div>
              {/* Reporter Info */}
              {selectedReport.reportedBy && (
                <div className="flex items-center gap-2">
                  <LuFlag className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Reported by:
                    <span className="font-medium ml-1">
                      {selectedReport.reportedBy.name}
                    </span>
                  </p>
                </div>
              )}
              {/* Target Info */}
              {selectedReport.songId && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm font-medium">Reported Track:</p>
                  <div className="flex justify-between items-center mt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Type: TRACK
                      </p>
                      <p className="font-medium">
                        {selectedReport.songId.title || "Unnamed track"}
                      </p>
                    </div>
                    {selectedReport.songId && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/track/${selectedReport.songId._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Track
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}{" "}
              {/* Resolution notes field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Resolution Notes:</label>
                <Input
                  type="text"
                  placeholder="Add notes about how this report was handled"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>
              {/* Flag track option */}
              {selectedReport && selectedReport.status === "PENDING" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="flagTrack"
                    checked={flagTrack}
                    onCheckedChange={(checked) =>
                      setFlagTrack(checked === true)
                    }
                  />
                  <label
                    htmlFor="flagTrack"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Flag this track as inappropriate/violent (will disable
                    public access)
                  </label>
                </div>
              )}
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <p>Reported on:</p>
                  <p>{formatDate(selectedReport.createdAt)}</p>
                </div>
                {selectedReport.updatedAt &&
                  selectedReport.status !== "PENDING" && (
                    <div>
                      <p>
                        {selectedReport.status === "REVIEWED"
                          ? "Reviewed on:"
                          : "Dismissed on:"}
                      </p>
                      <p>{formatDate(selectedReport.updatedAt)}</p>
                    </div>
                  )}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            {selectedReport && selectedReport.status === "PENDING" ? (
              <>
                {" "}
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => handleUpdateStatus("DISMISSED")}
                >
                  Dismiss Report
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => handleUpdateStatus("REVIEWED")}
                >
                  Mark as Reviewed
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;
