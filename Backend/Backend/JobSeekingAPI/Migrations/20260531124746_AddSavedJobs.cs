using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobSeekingAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddSavedJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "savedjobs",
                columns: table => new
                {
                    userid = table.Column<int>(type: "integer", nullable: false),
                    jobid = table.Column<int>(type: "integer", nullable: false),
                    savedat = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_savedjobs", x => new { x.userid, x.jobid });
                    table.ForeignKey(
                        name: "fk_savedjobs_candidates_userid",
                        column: x => x.userid,
                        principalTable: "candidates",
                        principalColumn: "userid",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_savedjobs_jobs_jobid",
                        column: x => x.jobid,
                        principalTable: "jobs",
                        principalColumn: "jobid",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_savedjobs_jobid",
                table: "savedjobs",
                column: "jobid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "savedjobs");
        }
    }
}
