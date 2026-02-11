import { json, type RequestHandler } from "@sveltejs/kit";
import { supabase } from "$lib/supabaseClient";
import { getChapterLength } from "$lib/novel";
import type { Chapter } from "$lib/novel";

/**
 * Cron job to update word count for all chapters
 * Processes chapters one by one and saves word_count to the database
 * 
 * Can be triggered by external cron services like:
 * - Vercel Cron Functions
 * - EasyCron
 * - AWS EventBridge
 * - etc.
 * 
 * Optional: Add CRON_SECRET environment variable for security
 */
export const GET: RequestHandler = async ({ request }) => {
  try {
    // Fetch all chapters with their content
    const { data: chapters, error: fetchError } = await supabase
      .from("chapters")
      .select("id, title, content, novel_id")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching chapters:", fetchError);
      throw fetchError;
    }

    if (!chapters || chapters.length === 0) {
      return json({
        success: true,
        message: "No chapters to update",
        updatedCount: 0,
      });
    }

    let updatedCount = 0;
    let errorCount = 0;
    const errors: { chapterId: string; error: string }[] = [];

    // Process chapters one by one
    for (const chapter of chapters) {
      try {
        // Calculate word count using existing utility
        const wordCount = getChapterLength(chapter as Chapter);

        // Update chapter with word_count
        const { error: updateError } = await supabase
          .from("chapters")
          .update({ word_count: wordCount })
          .eq("id", chapter.id);

        if (updateError) {
          errorCount++;
          errors.push({
            chapterId: chapter.id,
            error: updateError.message,
          });
          console.error(`Error updating chapter ${chapter.id}:`, updateError);
        } else {
          updatedCount++;
        }
      } catch (err: any) {
        errorCount++;
        errors.push({
          chapterId: chapter.id,
          error: err.message || "Unknown error",
        });
        console.error(`Exception processing chapter ${chapter.id}:`, err);
      }
    }

    // ================================
    // Phase 2: Update novel word counts
    // ================================

    // Fetch all novels with their chapters
    const { data: novels, error: novelsFetchError } = await supabase
      .from("novels")
      .select(
        `
        id,
        chapters (
          id,
          word_count
        )
      `
      );

    if (novelsFetchError) {
      console.error("Error fetching novels:", novelsFetchError);
      throw novelsFetchError;
    }

    let novelUpdatedCount = 0;
    let novelErrorCount = 0;
    const novelErrors: { novelId: string; error: string }[] = [];

    // Process each novel to update its total word count
    if (novels && novels.length > 0) {
      for (const novel of novels) {
        try {
          // Sum up word counts from all chapters
          const totalWordCount = (novel.chapters as any[])?.reduce(
            (acc, chapter) => acc + Math.floor(Number(chapter.word_count || 0)),
            0
          ) || 0;

          // Update novel with total word_count
          const { error: novelUpdateError } = await supabase
            .from("novels")
            .update({ word_count: totalWordCount })
            .eq("id", novel.id);

          if (novelUpdateError) {
            novelErrorCount++;
            novelErrors.push({
              novelId: novel.id,
              error: novelUpdateError.message,
            });
            console.error(`Error updating novel ${novel.id}:`, novelUpdateError);
          } else {
            novelUpdatedCount++;
          }
        } catch (err: any) {
          novelErrorCount++;
          novelErrors.push({
            novelId: novel.id,
            error: err.message || "Unknown error",
          });
          console.error(`Exception processing novel ${novel.id}:`, err);
        }
      }
    }

    return json({
      success: true,
      message: `Cron job completed: ${updatedCount} chapters updated (${errorCount} errors), ${novelUpdatedCount} novels updated (${novelErrorCount} errors)`,
      chapters: {
        totalChapters: chapters.length,
        updatedCount,
        errorCount,
        errors: errorCount > 0 ? errors : undefined,
      },
      novels: {
        totalNovels: novels?.length || 0,
        updatedCount: novelUpdatedCount,
        errorCount: novelErrorCount,
        errors: novelErrorCount > 0 ? novelErrors : undefined,
      },
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
};
