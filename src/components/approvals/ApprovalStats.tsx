import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ApprovalStatsProps {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalAll: number;
}

export function ApprovalStats({ totalPending, totalApproved, totalRejected, totalAll }: ApprovalStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{totalPending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aprovadas</p>
              <p className="text-2xl font-bold">{totalApproved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejeitadas</p>
              <p className="text-2xl font-bold">{totalRejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{totalAll}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
