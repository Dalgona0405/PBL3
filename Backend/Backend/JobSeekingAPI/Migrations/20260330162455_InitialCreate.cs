using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace JobSeekingAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "companies",
                columns: table => new
                {
                    companyid = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    companyname = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    logoimg = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    website = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    size = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    deletedat = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_companies", x => x.companyid);
                });

            migrationBuilder.CreateTable(
                name: "locations",
                columns: table => new
                {
                    locationid = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    locationname = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_locations", x => x.locationid);
                });

            migrationBuilder.CreateTable(
                name: "tags",
                columns: table => new
                {
                    tagid = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tagname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tags", x => x.tagid);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    userid = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    password = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    deletedat = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    lastlogin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.userid);
                });

            migrationBuilder.CreateTable(
                name: "jobs",
                columns: table => new
                {
                    jobid = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    companyid = table.Column<int>(type: "integer", nullable: false),
                    originalid = table.Column<string>(type: "text", nullable: true),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    salarymin = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    salarymax = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    expyear = table.Column<string>(type: "text", nullable: true),
                    level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    posteddate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    deadline = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    locationid = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    requirement = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    benefits = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    deletedat = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    viewcount = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jobs", x => x.jobid);
                    table.ForeignKey(
                        name: "fk_jobs_companies_companyid",
                        column: x => x.companyid,
                        principalTable: "companies",
                        principalColumn: "companyid",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_jobs_locations_locationid",
                        column: x => x.locationid,
                        principalTable: "locations",
                        principalColumn: "locationid",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "candidates",
                columns: table => new
                {
                    userid = table.Column<int>(type: "integer", nullable: false),
                    fullname = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    avatar = table.Column<string>(type: "text", nullable: true),
                    gender = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    birthday = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    cvurl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_candidates", x => x.userid);
                    table.ForeignKey(
                        name: "fk_candidates_users_userid",
                        column: x => x.userid,
                        principalTable: "users",
                        principalColumn: "userid",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "recruiters",
                columns: table => new
                {
                    userid = table.Column<int>(type: "integer", nullable: false),
                    fullname = table.Column<string>(type: "text", nullable: false),
                    avatar = table.Column<string>(type: "text", nullable: true),
                    companyid = table.Column<int>(type: "integer", nullable: false),
                    position = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_recruiters", x => x.userid);
                    table.ForeignKey(
                        name: "fk_recruiters_companies_companyid",
                        column: x => x.companyid,
                        principalTable: "companies",
                        principalColumn: "companyid",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_recruiters_users_userid",
                        column: x => x.userid,
                        principalTable: "users",
                        principalColumn: "userid",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "jobtags",
                columns: table => new
                {
                    jobid = table.Column<int>(type: "integer", nullable: false),
                    tagid = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jobtags", x => new { x.jobid, x.tagid });
                    table.ForeignKey(
                        name: "fk_jobtags_jobs_jobid",
                        column: x => x.jobid,
                        principalTable: "jobs",
                        principalColumn: "jobid",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_jobtags_tags_tagid",
                        column: x => x.tagid,
                        principalTable: "tags",
                        principalColumn: "tagid",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "applications",
                columns: table => new
                {
                    appid = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    userid = table.Column<int>(type: "integer", nullable: false),
                    jobid = table.Column<int>(type: "integer", nullable: false),
                    applieddate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    cvurl = table.Column<string>(type: "text", nullable: true),
                    deletedat = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_applications", x => x.appid);
                    table.ForeignKey(
                        name: "fk_applications_candidates_userid",
                        column: x => x.userid,
                        principalTable: "candidates",
                        principalColumn: "userid",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_applications_jobs_jobid",
                        column: x => x.jobid,
                        principalTable: "jobs",
                        principalColumn: "jobid",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "candidatetags",
                columns: table => new
                {
                    userid = table.Column<int>(type: "integer", nullable: false),
                    tagid = table.Column<int>(type: "integer", nullable: false),
                    proficiency = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_candidatetags", x => new { x.userid, x.tagid });
                    table.ForeignKey(
                        name: "fk_candidatetags_candidates_userid",
                        column: x => x.userid,
                        principalTable: "candidates",
                        principalColumn: "userid",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_candidatetags_tags_tagid",
                        column: x => x.tagid,
                        principalTable: "tags",
                        principalColumn: "tagid",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "experiences",
                columns: table => new
                {
                    expid = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    userid = table.Column<int>(type: "integer", nullable: false),
                    companyname = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    jobtitle = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    startdate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    enddate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_experiences", x => x.expid);
                    table.ForeignKey(
                        name: "fk_experiences_candidates_userid",
                        column: x => x.userid,
                        principalTable: "candidates",
                        principalColumn: "userid",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_applications_jobid",
                table: "applications",
                column: "jobid");

            migrationBuilder.CreateIndex(
                name: "ix_applications_status",
                table: "applications",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_applications_userid_jobid_unique",
                table: "applications",
                columns: new[] { "userid", "jobid" },
                unique: true,
                filter: "deletedat IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_candidatetags_tagid",
                table: "candidatetags",
                column: "tagid");

            migrationBuilder.CreateIndex(
                name: "ix_experiences_userid",
                table: "experiences",
                column: "userid");

            migrationBuilder.CreateIndex(
                name: "ix_jobs_companyid",
                table: "jobs",
                column: "companyid");

            migrationBuilder.CreateIndex(
                name: "ix_jobs_locationid",
                table: "jobs",
                column: "locationid");

            migrationBuilder.CreateIndex(
                name: "ix_jobtags_tagid",
                table: "jobtags",
                column: "tagid");

            migrationBuilder.CreateIndex(
                name: "ix_recruiters_companyid",
                table: "recruiters",
                column: "companyid");

            migrationBuilder.CreateIndex(
                name: "ix_tags_tagname_unique",
                table: "tags",
                column: "tagname",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_email_unique",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "applications");

            migrationBuilder.DropTable(
                name: "candidatetags");

            migrationBuilder.DropTable(
                name: "experiences");

            migrationBuilder.DropTable(
                name: "jobtags");

            migrationBuilder.DropTable(
                name: "recruiters");

            migrationBuilder.DropTable(
                name: "candidates");

            migrationBuilder.DropTable(
                name: "jobs");

            migrationBuilder.DropTable(
                name: "tags");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "companies");

            migrationBuilder.DropTable(
                name: "locations");
        }
    }
}
