<?php

namespace App\Jobs;

use Dompdf\Dompdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Equipment;

class PdfBuilderJob implements ShouldQueue
{
    use Queueable;

    // public function buildComparisonPdf(array $items, string $category): string
    public function buildComparisonPdf(array $items, string $category): string
    {

        if($category == "RPCSP") {
            $html = $this->buildRPCSP($items);
        } elseif($category == "PPE") {
            $html = $this->buildPPE($items);
        } else {
            return "";
        }

        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    private function buildPPE(array $items): string
    {
        $headerTitle = [
            "Article", "Description", "Unit", "Property Ro", "Property Co",
            "Unit Value", "Recorded Count", "Actual Count",
            "Shortage / Overage Qty", "Shortage / Overage Val",
            "Location", "Condition", "Remarks" 
        ];
        $headers = '<tr><th>' . implode('</th><th>', array_map('htmlspecialchars', $headerTitle)) . '</th></tr>';
        $rows = '';
        foreach ($items as $item) {
            $rows .= sprintf(
                '<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                htmlspecialchars($item['article'] ?? ''),
                htmlspecialchars($item['description'] ?? ''),
                htmlspecialchars($item['unit'] ?? ''),
                htmlspecialchars($item['property_ro'] ?? ''),
                htmlspecialchars($item['property_co'] ?? ''),
                htmlspecialchars($item['unit_value'] ?? ''),
                htmlspecialchars($item['recorded_count'] ?? ''),
                htmlspecialchars($item['actual_count'] ?? ''),
                htmlspecialchars($item['shortage_or_overage_qty'] ?? ''),
                htmlspecialchars($item['shortage_or_overage_val'] ?? ''),
                htmlspecialchars($item['location'] ?? ''),
                htmlspecialchars($item['remarks'] ?? ''),
                htmlspecialchars($item['condition'] ?? ""),

            );
        }

        return '
        <html>
          <head>
            <meta charset="utf-8">
            <title>Report</title>
            <style>
              body{font-family:Arial,Helvetica,sans-serif;font-size:6px}
              table{width:100%;border-collapse:collapse;margin-top:20px}
              th,td{border:1px solid #555;padding:8px;text-align:left}
              th{background:#eee}
            </style>
          </head>
          <body>
            <h2>PPE Report</h2>
            <table>
              <thead>' . $headers .'</thead>
              <tbody>' . $rows . '</tbody>
            </table>
          </body>
        </html>';
    }

    /* ---------------------------------
     |  Helpers
     | --------------------------------- */
    private function buildRPCSP(array $items): string
    {
        $headerTitle = [
            "Article", "Description", "Unit", "Semi Expendable Property No",
            "Unit Value", "Recorded Count", "Actual Count",
            "Shortage / Overage Qty", "Shortage / Overage Val",
            "Location", "Condition", "Remarks" 
        ];
        $headers = '<tr><th>' . implode('</th><th>', array_map('htmlspecialchars', $headerTitle)) . '</th></tr>';
        $rows = '';
        foreach ($items as $item) {
            $rows .= sprintf(
                '<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                htmlspecialchars($item['article']),
                htmlspecialchars($item['description']),
                htmlspecialchars($item['unit']),
                htmlspecialchars($item['semi_expendable_property_no']),
                htmlspecialchars($item['unit_value']),
                htmlspecialchars($item['recorded_count']),
                htmlspecialchars($item['actual_count']),
                htmlspecialchars($item['shortage_or_overage_qty']),
                htmlspecialchars($item['shortage_or_overage_val']),
                htmlspecialchars($item['location']),
                htmlspecialchars($item['condition'] ?? ""),
                htmlspecialchars($item['remarks']),

            );
        }

        return '
        <html>
          <head>
            <meta charset="utf-8">
            <title>Report</title>
            <style>
              body{font-family:Arial,Helvetica,sans-serif;font-size:8px}
              table{width:100%;border-collapse:collapse;margin-top:20px}
              th,td{border:1px solid #555;padding:8px;text-align:left}
              th{background:#eee}
            </style>
          </head>
          <body>
            <h2>RPCSP Report</h2>
            <table>
              <thead>' . $headers .'</thead>
              <tbody>' . $rows . '</tbody>
            </table>
          </body>
        </html>';
    }
}
